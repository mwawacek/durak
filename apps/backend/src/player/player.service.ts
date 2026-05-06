import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from './player.entity';

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
    if (trimmed.length < 2 || trimmed.length > 32) {
      throw new Error('Name must be 2-32 characters');
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

    const id = persisted?.id ?? `guest-${socketId}`;
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

  updateSocket(playerId: string, socketId: string): void {
    const p = this.onlinePlayers.get(playerId);
    if (p) {
      this.socketToPlayer.delete(p.socketId);
      p.socketId = socketId;
      this.socketToPlayer.set(socketId, playerId);
    }
  }

  handleDisconnect(socketId: string): string | null {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return null;
    this.socketToPlayer.delete(socketId);
    // keep onlinePlayers entry for reconnect grace period; caller decides when to drop
    return playerId;
  }

  remove(playerId: string): void {
    const p = this.onlinePlayers.get(playerId);
    if (p) {
      this.socketToPlayer.delete(p.socketId);
      this.onlinePlayers.delete(playerId);
    }
  }

  async recordGameResult(playerId: string, won: boolean, wasDurak: boolean): Promise<void> {
    if (!this.playerRepo || playerId.startsWith('guest-')) return;
    try {
      await this.playerRepo.increment({ id: playerId }, 'gamesPlayed', 1);
      if (won) await this.playerRepo.increment({ id: playerId }, 'gamesWon', 1);
      if (wasDurak) await this.playerRepo.increment({ id: playerId }, 'timesDurak', 1);
    } catch (err) {
      this.logger.warn(`Could not persist game result: ${(err as Error).message}`);
    }
  }
}
