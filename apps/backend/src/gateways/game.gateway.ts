import { BadRequestException, Logger, ValidationPipe, type Type } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  AckResult,
  ClientToServerEvents,
  ServerToClientEvents,
  SOCKET_EVENTS,
  ERROR_CODES,
  JoinLobbyResult,
  CreateRoomResult,
  JoinRoomResult,
} from '@durak/shared';
import { PlayerService } from '../player/player.service';
import { RoomService, RoomError } from '../room/room.service';
import { GameService } from '../game/game.service';
import { GameRuleError } from '../game/game.engine';
import { GameStateInternal } from '../game/game.types';
import {
  JoinLobbyDto,
  CreateRoomDto,
  RoomRefDto,
  PlayCardDto,
  DefendCardDto,
  RedirectAttackDto,
} from './dto';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Mobile users routinely background the tab for 30-60s (notifications,
// app-switcher, locking the screen). 30s was eating real games. 120s is
// "go grab a coffee" tolerance — the seat stays warm and the socket can
// reattach cleanly without anyone seeing "Tisch geschlossen".
const RECONNECT_GRACE_MS = 120_000;

// When the engine determines an auto-resolution (auto-take or auto-bito)
// would fire, we wait this long before actually committing + broadcasting
// the new state. Without the delay the opponent can read instant-resolution
// timing as a "the defender was trapped" tell. A small jitter window keeps
// the timing from being perfectly machine-predictable.
const AUTO_RESOLVE_DELAY_MS = 3_500;
const AUTO_RESOLVE_JITTER_MS = 500;

// CORS mirrors main.ts: when CORS_ORIGIN is "*" we cannot send credentials
// (browsers reject the combination), so credentials stay false.
//
// pingInterval/pingTimeout are tuned for mobile NAT: carriers + Fly's edge
// idle-kill TCP at ~30-60s, so a 10s heartbeat keeps the connection
// continuously "active" without flooding the line. Defaults (25s/20s) were
// the dominant cause of disconnect reports in production.
@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? '*', credentials: false },
  transports: ['websocket', 'polling'],
  pingInterval: 10_000,
  pingTimeout: 20_000,
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>();
  private readonly autoResolveTimers = new Map<string, NodeJS.Timeout>();

  @WebSocketServer()
  server!: TypedServer;

  constructor(
    private readonly players: PlayerService,
    private readonly rooms: RoomService,
    private readonly games: GameService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────

  handleConnection(client: TypedSocket): void {
    this.logger.debug(`Socket connected: ${client.id}`);
  }

  async handleDisconnect(client: TypedSocket): Promise<void> {
    const player = this.players.getBySocketId(client.id);
    if (!player) return;
    this.logger.debug(`Socket disconnected: ${player.name} (${player.id})`);

    // Mark rooms as "not connected" but keep the seat.
    const changedRooms = this.rooms.markDisconnect(player.id);
    for (const room of changedRooms) {
      const game = this.games.get(room.id);
      if (game) this.games.disconnect(room.id, player.id);
      this.broadcastRoomState(room.id);
      this.server.to(room.id).emit(SOCKET_EVENTS.PLAYER_LEFT, {
        roomId: room.id,
        playerId: player.id,
      });
    }

    // Grace period: if the player doesn't reconnect, drop them. Clearing
    // any existing timer first avoids leaked handles when a second socket
    // for the same player drops before the first grace period elapsed.
    const existing = this.disconnectTimers.get(player.id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.finalizeDisconnect(player.id);
      this.disconnectTimers.delete(player.id);
    }, RECONNECT_GRACE_MS);
    this.disconnectTimers.set(player.id, timer);
  }

  private finalizeDisconnect(playerId: string): void {
    const roomsForPlayer = this.rooms.roomsForPlayer(playerId);
    for (const room of roomsForPlayer) {
      if (room.status === 'lobby') {
        this.rooms.leave(room.id, playerId);
        this.broadcastRoomList();
        this.broadcastRoomState(room.id);
        continue;
      }
      // In-game timeout: same outcome as an explicit Verlassen — drop them
      // from membership AND from the engine, the rest of the table plays on.
      this.rooms.leave(room.id, playerId);
      this.dropFromGame(room.id, playerId);
      this.broadcastRoomList();
      this.broadcastRoomState(room.id);
    }
    this.players.remove(playerId);
  }

  /**
   * Eject a player from an in-progress game: their hand goes to the discard,
   * any cards they were defending get forfeited, rotation skips their seat.
   * The remaining players continue. If only one player is left standing the
   * engine ends the game naturally.
   *
   * Caller is responsible for cleaning up room membership + socket room
   * separately if the leave was explicit (so the projection broadcast doesn't
   * still list them as a member).
   */
  private dropFromGame(roomId: string, playerId: string): void {
    const updated = this.games.leave(roomId, playerId);
    if (!updated) return;
    this.afterGameMutation(roomId);
  }

  // ─────────────────────────────────────────────────────────────────
  // Client → Server
  // ─────────────────────────────────────────────────────────────────

  @SubscribeMessage(SOCKET_EVENTS.JOIN_LOBBY)
  async onJoinLobby(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() raw: unknown,
  ): Promise<AckResult<JoinLobbyResult>> {
    return this.tryAck(async () => {
      const payload = await this.validate(JoinLobbyDto, raw);
      const { id, name } = await this.players.register(
        payload.playerName,
        client.id,
        payload.playerId,
      );

      // Reconnect: clear pending disconnect timer.
      const timer = this.disconnectTimers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.disconnectTimers.delete(id);
      }
      this.players.updateSocket(id, client.id);

      // If this player was in rooms, re-join their socket channel and mark connected.
      const myRooms = this.rooms.roomsForPlayer(id);
      for (const room of myRooms) {
        client.join(room.id);
        this.rooms.markConnect(id);
        if (room.status === 'in-game') {
          this.games.reconnect(room.id, id);
          const view = this.games.viewFor(room.id, id);
          if (view) client.emit(SOCKET_EVENTS.GAME_STATE_UPDATE, view);
        }
        this.broadcastRoomState(room.id);
      }

      return {
        playerId: id,
        rooms: this.rooms.listPublic(),
      } satisfies JoinLobbyResult;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.CREATE_ROOM)
  onCreateRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() raw: unknown,
  ): Promise<AckResult<CreateRoomResult>> {
    return this.tryAck(async () => {
      const payload = await this.validate(CreateRoomDto, raw);
      const player = this.requirePlayer(client);
      const room = this.rooms.create(player.id, player.name, payload.name, payload.maxPlayers);
      client.join(room.id);
      this.broadcastRoomList();
      return { room: this.rooms.toPublic(room) };
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.JOIN_ROOM)
  onJoinRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() raw: unknown,
  ): Promise<AckResult<JoinRoomResult>> {
    return this.tryAck(async () => {
      const payload = await this.validate(RoomRefDto, raw);
      const player = this.requirePlayer(client);
      const room = this.rooms.join(payload.roomId, player.id, player.name);
      client.join(room.id);
      this.server.to(room.id).emit(SOCKET_EVENTS.PLAYER_JOINED, {
        roomId: room.id,
        playerId: player.id,
        playerName: player.name,
      });
      this.broadcastRoomState(room.id);
      this.broadcastRoomList();
      return { room: this.rooms.toPublic(room) };
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.LEAVE_ROOM)
  onLeaveRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() raw: unknown,
  ): Promise<AckResult<void>> {
    return this.tryAck(async () => {
      const payload = await this.validate(RoomRefDto, raw);
      const player = this.requirePlayer(client);
      const wasInGame = this.rooms.get(payload.roomId)?.status === 'in-game';
      const room = this.rooms.leave(payload.roomId, player.id);
      client.leave(payload.roomId);
      if (room) {
        this.server.to(room.id).emit(SOCKET_EVENTS.PLAYER_LEFT, {
          roomId: room.id,
          playerId: player.id,
        });
        if (wasInGame) {
          this.dropFromGame(room.id, player.id);
        }
        this.broadcastRoomState(room.id);
      }
      this.broadcastRoomList();
      return undefined;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.START_GAME)
  onStartGame(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() raw: unknown,
  ): Promise<AckResult<void>> {
    return this.tryAck(async () => {
      const payload = await this.validate(RoomRefDto, raw);
      const player = this.requirePlayer(client);
      const room = this.rooms.startGame(payload.roomId, player.id);
      const game = this.games.create(
        room.id,
        room.members.map((m) => ({ id: m.id, name: m.name })),
      );
      this.broadcastRoomList();
      this.broadcastRoomState(room.id);
      this.emitRoundStarted(room.id, game);
      this.broadcastGameState(room.id);
      return undefined;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.PLAY_CARD)
  onPlayCard(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() raw: unknown,
  ): Promise<AckResult<void>> {
    return this.tryAck(async () => {
      const payload = await this.validate(PlayCardDto, raw);
      const player = this.requirePlayer(client);
      this.games.attack(payload.roomId, player.id, payload.card);
      this.afterGameMutation(payload.roomId);
      return undefined;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.DEFEND_CARD)
  onDefendCard(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() raw: unknown,
  ): Promise<AckResult<void>> {
    return this.tryAck(async () => {
      const payload = await this.validate(DefendCardDto, raw);
      const player = this.requirePlayer(client);
      this.games.defend(payload.roomId, player.id, payload.attackCardId, payload.defenseCard);
      this.afterGameMutation(payload.roomId);
      return undefined;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.REDIRECT_ATTACK)
  onRedirectAttack(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() raw: unknown,
  ): Promise<AckResult<void>> {
    return this.tryAck(async () => {
      const payload = await this.validate(RedirectAttackDto, raw);
      const player = this.requirePlayer(client);
      const state = this.games.redirect(payload.roomId, player.id, payload.card);
      this.afterGameMutation(payload.roomId, { roundStartedState: state });
      return undefined;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.END_TURN)
  onEndTurn(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() raw: unknown,
  ): Promise<AckResult<void>> {
    return this.tryAck(async () => {
      const payload = await this.validate(RoomRefDto, raw);
      const player = this.requirePlayer(client);
      const state = this.games.endTurn(payload.roomId, player.id);
      this.afterGameMutation(payload.roomId, { roundStartedState: state });
      return undefined;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.TAKE_CARDS)
  onTakeCards(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() raw: unknown,
  ): Promise<AckResult<void>> {
    return this.tryAck(async () => {
      const payload = await this.validate(RoomRefDto, raw);
      const player = this.requirePlayer(client);
      const state = this.games.takeCards(payload.roomId, player.id);
      this.afterGameMutation(payload.roomId, { roundStartedState: state });
      return undefined;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Broadcasting
  // ─────────────────────────────────────────────────────────────────

  private broadcastRoomList(): void {
    this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATE, this.rooms.listPublic());
  }

  private broadcastRoomState(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    // Piggyback onto ROOM_LIST_UPDATE for simplicity — clients merge by id.
    this.server.to(roomId).emit(SOCKET_EVENTS.ROOM_LIST_UPDATE, [this.rooms.toPublic(room)]);
  }

  private broadcastGameState(roomId: string): void {
    const views = this.games.viewsFor(roomId);
    if (!views) return;
    for (const [playerId, view] of views) {
      const socketId = this.players.getSocketId(playerId);
      if (socketId) {
        this.server.to(socketId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, view);
      }
    }
  }

  /** After every successful engine mutation, broadcast the per-player game
   *  state, optionally emit ROUND_STARTED for handlers that rotated the
   *  round, finalise the game if it ended, and (re)evaluate whether an
   *  auto-resolution (auto-take / auto-bito) should be scheduled. Any prior
   *  pending auto-timer is cancelled first because the state just changed —
   *  the new state needs a fresh look. */
  private afterGameMutation(
    roomId: string,
    options?: { roundStartedState?: GameStateInternal },
  ): void {
    this.broadcastGameState(roomId);
    if (options?.roundStartedState) {
      this.emitRoundStarted(roomId, options.roundStartedState);
    }
    const finished = this.maybeFinishGame(roomId);
    if (!finished) this.maybeScheduleAutoResolution(roomId);
  }

  private emitRoundStarted(roomId: string, state: GameStateInternal): void {
    if (state.phase === 'finished') return;
    this.server.to(roomId).emit(SOCKET_EVENTS.ROUND_STARTED, {
      roomId,
      attackerId: state.players[state.attackerIdx]!.id,
      defenderId: state.players[state.defenderIdx]!.id,
    });
  }

  /**
   * Cancels any existing auto-timer for the room, then asks the engine whether
   * an auto-take / auto-bito would fire on the current state. If yes, schedules
   * a commit + broadcast after a randomised delay so the opponent can't read
   * resolution timing as information ("they had nothing, instant auto-take").
   *
   * If a user action arrives in the meantime, `afterGameMutation` re-runs this
   * and the in-flight timer is replaced with a fresh one keyed to the new
   * state — so a pile-on extending a stuck round, for instance, resets the
   * clock and the trap stays opaque.
   */
  private maybeScheduleAutoResolution(roomId: string): void {
    this.cancelAutoResolution(roomId);
    const kind = this.games.pendingAutoResolution(roomId);
    if (!kind) return;
    const delay =
      AUTO_RESOLVE_DELAY_MS + Math.floor(Math.random() * AUTO_RESOLVE_JITTER_MS);
    const timer = setTimeout(() => {
      this.autoResolveTimers.delete(roomId);
      this.fireAutoResolution(roomId, kind);
    }, delay);
    this.autoResolveTimers.set(roomId, timer);
  }

  private cancelAutoResolution(roomId: string): void {
    const existing = this.autoResolveTimers.get(roomId);
    if (existing) {
      clearTimeout(existing);
      this.autoResolveTimers.delete(roomId);
    }
  }

  /**
   * Timer callback. Re-checks the engine condition (the state may have
   * advanced between schedule and fire — e.g. the defender manually took, or
   * a pile-on landed) and commits only if the original auto-resolution kind
   * still applies. If the kind has changed, `afterGameMutation` already
   * scheduled a fresh timer for it.
   */
  private fireAutoResolution(roomId: string, kind: 'take' | 'bito'): void {
    const current = this.games.pendingAutoResolution(roomId);
    if (current !== kind) return;
    try {
      if (kind === 'take') this.games.commitAutoTake(roomId);
      else this.games.commitAutoBito(roomId);
    } catch (err) {
      this.logger.warn(`auto-resolution (${kind}) for ${roomId} failed: ${(err as Error).message}`);
      return;
    }
    this.afterGameMutation(roomId);
  }

  /** Returns true iff the game just finished. Caller suppresses follow-up
   *  work (like scheduling an auto-resolution) in that case. */
  private maybeFinishGame(roomId: string): boolean {
    const snap = this.games.snapshot(roomId);
    if (!snap || snap.phase !== 'finished') return false;
    this.cancelAutoResolution(roomId);
    this.rooms.finishGame(roomId);
    this.broadcastRoomList();
    // Persist player stats.
    for (const p of snap.players) {
      const wasDurak = snap.loserId === p.id;
      const won = p.hasFinished && !wasDurak;
      void this.players.recordGameResult(p.id, won, wasDurak);
    }
    return true;
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────

  private requirePlayer(client: TypedSocket): { id: string; name: string } {
    const p = this.players.getBySocketId(client.id);
    if (!p) {
      throw new GameRuleError(ERROR_CODES.UNAUTHORIZED, 'Not authenticated — call joinLobby first');
    }
    return p;
  }

  // ─────────────────────────────────────────────────────────────────
  // Payload validation
  //
  // The global ValidationPipe in main.ts only fires for HTTP routes — for
  // Socket.IO gateways NestJS catches BadRequestException in the WS proxy
  // and never invokes the client ack, so callers see a timeout instead of
  // a typed error. We re-use the same pipe configuration manually here so
  // the throw flows through tryAck and becomes a structured INVALID_PAYLOAD
  // ack response.
  // ─────────────────────────────────────────────────────────────────
  private readonly validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  private async validate<T>(dto: Type<T>, payload: unknown): Promise<T> {
    try {
      return (await this.validationPipe.transform(payload, {
        type: 'body',
        metatype: dto,
      })) as T;
    } catch (err) {
      if (err instanceof BadRequestException) {
        const response = err.getResponse();
        const message =
          typeof response === 'string'
            ? response
            : ((response as { message?: string | string[] }).message ?? 'Invalid payload');
        throw new GameRuleError(
          ERROR_CODES.INVALID_PAYLOAD,
          Array.isArray(message) ? message.join('; ') : message,
        );
      }
      throw err;
    }
  }

  private async tryAck<T>(fn: () => Promise<T>): Promise<AckResult<T>> {
    try {
      return { ok: true, data: await fn() };
    } catch (err) {
      return this.toAckError(err);
    }
  }

  private toAckError(err: unknown): AckResult<never> {
    if (err instanceof RoomError || err instanceof GameRuleError) {
      return { ok: false, error: { code: err.code, message: err.message } };
    }
    const rawMessage = err instanceof Error ? err.message : String(err);
    this.logger.error(rawMessage, err instanceof Error ? err.stack : undefined);
    // Sanitise: never forward a raw thrown message to the client — could leak
    // DB column names, file paths, or other server internals. Typed engine
    // errors (GameRuleError / RoomError) take the early-return branch above.
    return {
      ok: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Interner Fehler' },
    };
  }
}
