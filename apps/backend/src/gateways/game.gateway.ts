import { Logger } from '@nestjs/common';
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
  RoomPublic,
  JoinLobbyPayload,
  JoinLobbyResult,
  CreateRoomPayload,
  CreateRoomResult,
  JoinRoomPayload,
  JoinRoomResult,
  LeaveRoomPayload,
  StartGamePayload,
  PlayCardPayload,
  DefendCardPayload,
  RedirectAttackPayload,
  EndTurnPayload,
  TakeCardsPayload,
} from '@durak/shared';
import { PlayerService } from '../player/player.service';
import { RoomService, RoomError } from '../room/room.service';
import { GameService } from '../game/game.service';
import { GameRuleError } from '../game/game.engine';
import { GameStateInternal } from '../game/game.types';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const RECONNECT_GRACE_MS = 30_000;

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>();
  private readonly socketToRooms = new Map<string, Set<string>>();

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
    this.socketToRooms.set(client.id, new Set());
  }

  async handleDisconnect(client: TypedSocket): Promise<void> {
    const player = this.players.getBySocketId(client.id);
    if (!player) {
      this.socketToRooms.delete(client.id);
      return;
    }
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

    // Grace period: if the player doesn't reconnect, drop them.
    const timer = setTimeout(() => {
      this.finalizeDisconnect(player.id);
      this.disconnectTimers.delete(player.id);
    }, RECONNECT_GRACE_MS);
    this.disconnectTimers.set(player.id, timer);

    this.socketToRooms.delete(client.id);
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
      // In-game room: a player who never came back can't be safely "removed"
      // mid-game — the engine indexes (attackerIdx/defenderIdx, rotation,
      // pile-on neighbours) all assume the player array is stable. Abandoning
      // the game is the safest recovery: free the engine state, mark the room
      // finished, notify everyone in the room, and drop them all.
      this.games.remove(room.id);
      this.server.to(room.id).emit(SOCKET_EVENTS.ERROR_MESSAGE, {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Spieler hat das Spiel verlassen — Tisch wird geschlossen.',
      });
      this.rooms.finishGame(room.id);
      this.broadcastRoomList();
      this.broadcastRoomState(room.id);
    }
    this.players.remove(playerId);
  }

  // ─────────────────────────────────────────────────────────────────
  // Client → Server
  // ─────────────────────────────────────────────────────────────────

  @SubscribeMessage(SOCKET_EVENTS.JOIN_LOBBY)
  async onJoinLobby(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: JoinLobbyPayload,
  ): Promise<AckResult<JoinLobbyResult>> {
    return this.tryAck(async () => {
      const { id, name } = await this.players.register(payload.playerName, client.id);

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
        this.trackSocketRoom(client.id, room.id);
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
        rooms: this.rooms.list().map((r) => this.rooms.toPublic(r)),
      } satisfies JoinLobbyResult;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.CREATE_ROOM)
  onCreateRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: CreateRoomPayload,
  ): AckResult<CreateRoomResult> {
    return this.trySync(() => {
      const player = this.requirePlayer(client);
      const room = this.rooms.create(player.id, player.name, payload.name, payload.maxPlayers);
      client.join(room.id);
      this.trackSocketRoom(client.id, room.id);
      this.broadcastRoomList();
      return { room: this.rooms.toPublic(room) };
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.JOIN_ROOM)
  onJoinRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: JoinRoomPayload,
  ): AckResult<JoinRoomResult> {
    return this.trySync(() => {
      const player = this.requirePlayer(client);
      const room = this.rooms.join(payload.roomId, player.id, player.name);
      client.join(room.id);
      this.trackSocketRoom(client.id, room.id);
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
    @MessageBody() payload: LeaveRoomPayload,
  ): AckResult<void> {
    return this.trySync(() => {
      const player = this.requirePlayer(client);
      const room = this.rooms.leave(payload.roomId, player.id);
      client.leave(payload.roomId);
      this.untrackSocketRoom(client.id, payload.roomId);
      if (room) {
        this.server.to(room.id).emit(SOCKET_EVENTS.PLAYER_LEFT, {
          roomId: room.id,
          playerId: player.id,
        });
        this.broadcastRoomState(room.id);
      }
      this.broadcastRoomList();
      return undefined;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.START_GAME)
  onStartGame(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: StartGamePayload,
  ): AckResult<void> {
    return this.trySync(() => {
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
    @MessageBody() payload: PlayCardPayload,
  ): AckResult<void> {
    return this.trySync(() => {
      const player = this.requirePlayer(client);
      this.games.attack(payload.roomId, player.id, payload.card);
      this.broadcastGameState(payload.roomId);
      this.maybeFinishGame(payload.roomId);
      return undefined;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.DEFEND_CARD)
  onDefendCard(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: DefendCardPayload,
  ): AckResult<void> {
    return this.trySync(() => {
      const player = this.requirePlayer(client);
      this.games.defend(payload.roomId, player.id, payload.attackCardId, payload.defenseCard);
      this.broadcastGameState(payload.roomId);
      this.maybeFinishGame(payload.roomId);
      return undefined;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.REDIRECT_ATTACK)
  onRedirectAttack(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: RedirectAttackPayload,
  ): AckResult<void> {
    return this.trySync(() => {
      const player = this.requirePlayer(client);
      const state = this.games.redirect(payload.roomId, player.id, payload.card);
      this.broadcastGameState(payload.roomId);
      this.emitRoundStarted(payload.roomId, state);
      this.maybeFinishGame(payload.roomId);
      return undefined;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.END_TURN)
  onEndTurn(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: EndTurnPayload,
  ): AckResult<void> {
    return this.trySync(() => {
      const player = this.requirePlayer(client);
      const state = this.games.endTurn(payload.roomId, player.id);
      this.broadcastGameState(payload.roomId);
      this.emitRoundStarted(payload.roomId, state);
      this.maybeFinishGame(payload.roomId);
      return undefined;
    });
  }

  @SubscribeMessage(SOCKET_EVENTS.TAKE_CARDS)
  onTakeCards(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: TakeCardsPayload,
  ): AckResult<void> {
    return this.trySync(() => {
      const player = this.requirePlayer(client);
      const state = this.games.takeCards(payload.roomId, player.id);
      this.broadcastGameState(payload.roomId);
      this.emitRoundStarted(payload.roomId, state);
      this.maybeFinishGame(payload.roomId);
      return undefined;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Broadcasting
  // ─────────────────────────────────────────────────────────────────

  private broadcastRoomList(): void {
    const list: RoomPublic[] = this.rooms.list().map((r) => this.rooms.toPublic(r));
    this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATE, list);
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

  private emitRoundStarted(roomId: string, state: GameStateInternal): void {
    if (state.phase === 'finished') return;
    this.server.to(roomId).emit(SOCKET_EVENTS.ROUND_STARTED, {
      roomId,
      attackerId: state.players[state.attackerIdx]!.id,
      defenderId: state.players[state.defenderIdx]!.id,
    });
  }

  private maybeFinishGame(roomId: string): void {
    const snap = this.games.snapshot(roomId);
    if (!snap || snap.phase !== 'finished') return;
    this.rooms.finishGame(roomId);
    this.broadcastRoomList();
    // Persist player stats.
    for (const p of snap.players) {
      const wasDurak = snap.loserId === p.id;
      const won = p.hasFinished && !wasDurak;
      void this.players.recordGameResult(p.id, won, wasDurak);
    }
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

  private trackSocketRoom(socketId: string, roomId: string): void {
    const rooms = this.socketToRooms.get(socketId) ?? new Set<string>();
    rooms.add(roomId);
    this.socketToRooms.set(socketId, rooms);
  }

  private untrackSocketRoom(socketId: string, roomId: string): void {
    this.socketToRooms.get(socketId)?.delete(roomId);
  }

  private trySync<T>(fn: () => T): AckResult<T> {
    try {
      return { ok: true, data: fn() };
    } catch (err) {
      return this.toAckError(err);
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
    const message = err instanceof Error ? err.message : 'Unknown error';
    this.logger.error(message, err instanceof Error ? err.stack : undefined);
    return { ok: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message } };
  }
}
