import { Injectable, Logger } from '@nestjs/common';
import { MAX_PLAYERS, MIN_PLAYERS, RoomPublic, RoomStatus, ERROR_CODES } from '@durak/shared';
import { randomUUID } from 'crypto';

interface RoomMember {
  id: string;
  name: string;
  isConnected: boolean;
}

interface RoomInternal {
  id: string;
  name: string;
  ownerId: string;
  maxPlayers: number;
  status: RoomStatus;
  members: RoomMember[];
  createdAt: number;
}

export class RoomError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private readonly rooms = new Map<string, RoomInternal>();

  create(ownerId: string, ownerName: string, roomName: string, maxPlayers: number): RoomInternal {
    const cleaned = roomName.trim().slice(0, 48);
    if (cleaned.length < 2) throw new RoomError(ERROR_CODES.INVALID_PAYLOAD, 'Room name too short');
    if (maxPlayers < MIN_PLAYERS || maxPlayers > MAX_PLAYERS) {
      throw new RoomError(ERROR_CODES.INVALID_PAYLOAD, `maxPlayers must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`);
    }

    const id = randomUUID();
    const room: RoomInternal = {
      id,
      name: cleaned,
      ownerId,
      maxPlayers,
      status: 'lobby',
      members: [{ id: ownerId, name: ownerName, isConnected: true }],
      createdAt: Date.now(),
    };
    this.rooms.set(id, room);
    this.logger.log(`Room ${id} created by ${ownerId}`);
    return room;
  }

  join(roomId: string, playerId: string, playerName: string): RoomInternal {
    const room = this.require(roomId);
    if (room.status !== 'lobby') throw new RoomError(ERROR_CODES.GAME_ALREADY_STARTED, 'Game in progress');
    if (room.members.length >= room.maxPlayers) throw new RoomError(ERROR_CODES.ROOM_FULL, 'Room is full');
    const existing = room.members.find((m) => m.id === playerId);
    if (existing) {
      existing.isConnected = true;
      existing.name = playerName;
      return room;
    }
    room.members.push({ id: playerId, name: playerName, isConnected: true });
    return room;
  }

  leave(roomId: string, playerId: string): RoomInternal | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.members = room.members.filter((m) => m.id !== playerId);
    if (room.members.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }
    if (room.ownerId === playerId) {
      room.ownerId = room.members[0]!.id;
    }
    return room;
  }

  markDisconnect(playerId: string): RoomInternal[] {
    const changed: RoomInternal[] = [];
    for (const room of this.rooms.values()) {
      const member = room.members.find((m) => m.id === playerId);
      if (member && member.isConnected) {
        member.isConnected = false;
        changed.push(room);
      }
    }
    return changed;
  }

  markConnect(playerId: string): RoomInternal[] {
    const changed: RoomInternal[] = [];
    for (const room of this.rooms.values()) {
      const member = room.members.find((m) => m.id === playerId);
      if (member && !member.isConnected) {
        member.isConnected = true;
        changed.push(room);
      }
    }
    return changed;
  }

  startGame(roomId: string, ownerId: string): RoomInternal {
    const room = this.require(roomId);
    if (room.ownerId !== ownerId) throw new RoomError(ERROR_CODES.UNAUTHORIZED, 'Only owner can start');
    if (room.status !== 'lobby') throw new RoomError(ERROR_CODES.GAME_ALREADY_STARTED, 'Already started');
    if (room.members.length < MIN_PLAYERS) {
      throw new RoomError(ERROR_CODES.INVALID_MOVE, `Need at least ${MIN_PLAYERS} players`);
    }
    room.status = 'in-game';
    return room;
  }

  finishGame(roomId: string): RoomInternal | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.status = 'finished';
    return room;
  }

  require(roomId: string): RoomInternal {
    const room = this.rooms.get(roomId);
    if (!room) throw new RoomError(ERROR_CODES.ROOM_NOT_FOUND, 'Room not found');
    return room;
  }

  get(roomId: string): RoomInternal | null {
    return this.rooms.get(roomId) ?? null;
  }

  list(): RoomInternal[] {
    return [...this.rooms.values()];
  }

  roomsForPlayer(playerId: string): RoomInternal[] {
    return [...this.rooms.values()].filter((r) => r.members.some((m) => m.id === playerId));
  }

  toPublic(room: RoomInternal): RoomPublic {
    return {
      id: room.id,
      name: room.name,
      ownerId: room.ownerId,
      maxPlayers: room.maxPlayers,
      status: room.status,
      createdAt: room.createdAt,
      players: room.members.map((m) => ({
        id: m.id,
        name: m.name,
        handCount: 0,
        isConnected: m.isConnected,
        hasFinished: false,
      })),
    };
  }
}
