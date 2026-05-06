import type { Card } from './cards';
import type { GameStatePrivate, RoomPublic } from './game';

export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_LOBBY: 'joinLobby',
  LEAVE_LOBBY: 'leaveLobby',
  CREATE_ROOM: 'createRoom',
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  START_GAME: 'startGame',
  PLAY_CARD: 'playCard',
  DEFEND_CARD: 'defendCard',
  REDIRECT_ATTACK: 'redirectAttack',
  END_TURN: 'endTurn',
  TAKE_CARDS: 'takeCards',

  // Server → Client
  GAME_STATE_UPDATE: 'gameStateUpdate',
  ROOM_LIST_UPDATE: 'roomListUpdate',
  PLAYER_JOINED: 'playerJoined',
  PLAYER_LEFT: 'playerLeft',
  ROUND_STARTED: 'roundStarted',
  ERROR_MESSAGE: 'errorMessage',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export type AckResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

type Ack<T> = (result: AckResult<T>) => void;

export interface JoinLobbyPayload {
  playerName: string;
}
export interface JoinLobbyResult {
  playerId: string;
  rooms: RoomPublic[];
}

export interface CreateRoomPayload {
  name: string;
  maxPlayers: number;
}
export interface CreateRoomResult {
  room: RoomPublic;
}

export interface JoinRoomPayload {
  roomId: string;
}
export interface JoinRoomResult {
  room: RoomPublic;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface StartGamePayload {
  roomId: string;
}

export interface PlayCardPayload {
  roomId: string;
  card: Card;
}

export interface DefendCardPayload {
  roomId: string;
  attackCardId: string;
  defenseCard: Card;
}

export interface RedirectAttackPayload {
  roomId: string;
  card: Card;
}

export interface EndTurnPayload {
  roomId: string;
}

export interface TakeCardsPayload {
  roomId: string;
}

export interface ClientToServerEvents {
  [SOCKET_EVENTS.JOIN_LOBBY]: (payload: JoinLobbyPayload, ack: Ack<JoinLobbyResult>) => void;
  [SOCKET_EVENTS.LEAVE_LOBBY]: (ack: Ack<void>) => void;
  [SOCKET_EVENTS.CREATE_ROOM]: (payload: CreateRoomPayload, ack: Ack<CreateRoomResult>) => void;
  [SOCKET_EVENTS.JOIN_ROOM]: (payload: JoinRoomPayload, ack: Ack<JoinRoomResult>) => void;
  [SOCKET_EVENTS.LEAVE_ROOM]: (payload: LeaveRoomPayload, ack: Ack<void>) => void;
  [SOCKET_EVENTS.START_GAME]: (payload: StartGamePayload, ack: Ack<void>) => void;
  [SOCKET_EVENTS.PLAY_CARD]: (payload: PlayCardPayload, ack: Ack<void>) => void;
  [SOCKET_EVENTS.DEFEND_CARD]: (payload: DefendCardPayload, ack: Ack<void>) => void;
  [SOCKET_EVENTS.REDIRECT_ATTACK]: (payload: RedirectAttackPayload, ack: Ack<void>) => void;
  [SOCKET_EVENTS.END_TURN]: (payload: EndTurnPayload, ack: Ack<void>) => void;
  [SOCKET_EVENTS.TAKE_CARDS]: (payload: TakeCardsPayload, ack: Ack<void>) => void;
}

export interface ServerToClientEvents {
  [SOCKET_EVENTS.GAME_STATE_UPDATE]: (state: GameStatePrivate) => void;
  [SOCKET_EVENTS.ROOM_LIST_UPDATE]: (rooms: RoomPublic[]) => void;
  [SOCKET_EVENTS.PLAYER_JOINED]: (payload: { roomId: string; playerId: string; playerName: string }) => void;
  [SOCKET_EVENTS.PLAYER_LEFT]: (payload: { roomId: string; playerId: string }) => void;
  [SOCKET_EVENTS.ROUND_STARTED]: (payload: { roomId: string; attackerId: string; defenderId: string }) => void;
  [SOCKET_EVENTS.ERROR_MESSAGE]: (payload: { code: string; message: string }) => void;
}

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  NOT_IN_ROOM: 'NOT_IN_ROOM',
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  INVALID_MOVE: 'INVALID_MOVE',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
