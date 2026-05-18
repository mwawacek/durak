import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERROR_CODES, NAME_MIN_LEN, PLAYER_NAME_MAX_LEN } from '@durak/shared';
import { PlayerEntity } from './player.entity';
import { GameRuleError } from '../game/game.engine';

const GUEST_PREFIX = 'guest-';

/**
 * Tracks live (socket-connected) players plus persists profile data.
 * Game state is held in memory by GameService — this service is the
 * identity + stats layer only.
 */
@Injectable()
export class PlayerService {
  private readonly logger = new Logger(PlayerService.name);
  private readonly socketToPlayer = new Map<string, string>(); // socketId -> playerId
  private readonly onlinePlayers = new Map<string, { id: string; name: string; socketId: string }>();

  constructor(
    @Optional()
    @InjectRepository(PlayerEntity)
    private readonly playerRepo?: Repository<PlayerEntity>,
  ) {}

  async register(name: string, socketId: string): Promise<{ id: string; name: string }> {
    const trimmed = name.trim();
    if (trimmed.length < NAME_MIN_LEN || trimmed.length > PLAYER_NAME_MAX_LEN) {
      throw new GameRuleError(
        ERROR_CODES.INVALID_PAYLOAD,
        `Name muss ${NAME_MIN_LEN}–${PLAYER_NAME_MAX_LEN} Zeichen lang sein`,
      );
    }

    let persisted: Pick<PlayerEntity, 'id' | 'name'> | null = null;
    try {
      if (this.playerRepo) {
        const existing = await this.playerRepo.findOne({ where: { name: trimmed } });
        persisted = existing ?? (await this.playerRepo.save(this.playerRepo.create({ name: trimmed })));
      }
    } catch (err) {
      this.logger.warn(`DB unavailable, continuing in-memory: ${(err as Error).message}`);
    }

    // Without DB: derive a stable id from the (case-insensitive) name so a
    // dropped guest reconnecting under the same name reclaims their identity.
    // If a different socket is *already online* under that slug (i.e. two
    // people happen to pick "Anna"), the second one gets a random suffix so
    // they don't hijack the first's seat.
    const slug =
      trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'anon';
    let id = persisted?.id ?? `${GUEST_PREFIX}${slug}`;

    if (!persisted) {
      const existing = this.onlinePlayers.get(id);
      if (existing && existing.socketId !== socketId) {
        // Real collision (different live socket): mint a new id with a suffix.
        const suffix = Math.random().toString(36).slice(2, 6);
        id = `${GUEST_PREFIX}${slug}-${suffix}`;
      }
    }

    this.onlinePlayers.set(id, { id, name: trimmed, socketId });
    this.socketToPlayer.set(socketId, id);
    return { id, name: trimmed };
  }

  getBySocketId(socketId: string): { id: string; name: string } | null {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return null;
    const p = this.onlinePlayers.get(playerId);
    return p ? { id: p.id, name: p.name } : null;
  }

  getSocketId(playerId: string): string | null {
    return this.onlinePlayers.get(playerId)?.socketId ?? null;
  }

  updateSocket(playerId: string, socketId: string): void {
    const p = this.onlinePlayers.get(playerId);
    if (p) {
      this.socketToPlayer.delete(p.socketId);
      p.socketId = socketId;
      this.socketToPlayer.set(socketId, playerId);
    }
  }

  remove(playerId: string): void {
    const p = this.onlinePlayers.get(playerId);
    if (p) {
      this.socketToPlayer.delete(p.socketId);
      this.onlinePlayers.delete(playerId);
    }
  }

  async recordGameResult(playerId: string, won: boolean, wasDurak: boolean): Promise<void> {
    if (!this.playerRepo || playerId.startsWith(GUEST_PREFIX)) return;
    try {
      await this.playerRepo
        .createQueryBuilder()
        .update(PlayerEntity)
        .set({
          gamesPlayed: () => 'games_played + 1',
          gamesWon: () => `games_won + ${won ? 1 : 0}`,
          timesDurak: () => `times_durak + ${wasDurak ? 1 : 0}`,
        })
        .where('id = :id', { id: playerId })
        .execute();
    } catch (err) {
      this.logger.warn(`Could not persist game result: ${(err as Error).message}`);
    }
  }
}
