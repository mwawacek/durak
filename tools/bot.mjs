#!/usr/bin/env node
/**
 * Durak-Bot — loggt sich als Spieler ein, tritt einem offenen Raum bei
 * (oder erstellt selbst einen) und spielt regelkonforme, einfache Züge.
 *
 * Nutzung:
 *   node tools/bot.mjs [name] [--host http://localhost:3001] [--room <roomId>] [--host-room]
 *
 * Beispiele:
 *   node tools/bot.mjs               # Bot "Bot-1", tritt dem ersten offenen Raum bei
 *   node tools/bot.mjs Olga          # Bot mit Namen "Olga"
 *   node tools/bot.mjs Olga --host-room  # Bot erstellt + hostet einen Raum und wartet
 *   node tools/bot.mjs --host http://192.168.1.23:3001
 */
import { io } from '../node_modules/socket.io-client/build/esm/index.js';
import { SOCKET_EVENTS, RANK_ORDER, beats, ranksOnTable } from '../packages/shared/dist/index.js';

const args = process.argv.slice(2);
const flagIdx = args.findIndex((a) => a.startsWith('--'));
const positional = flagIdx < 0 ? args : args.slice(0, flagIdx);
const name = positional[0] ?? `Bot-${Math.floor(Math.random() * 900 + 100)}`;
const getFlag = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const HOST = getFlag('--host') ?? 'http://localhost:3001';
const ROOM_ID = getFlag('--room');
const HOST_ROOM = args.includes('--host-room');

const ack = (socket, event, ...payload) =>
  new Promise((resolve, reject) => {
    socket.timeout(10_000).emit(event, ...payload, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const cheapestNonTrumpFirst = (cards, trumpSuit) =>
  [...cards].sort((a, b) => {
    const aT = a.suit === trumpSuit ? 1 : 0;
    const bT = b.suit === trumpSuit ? 1 : 0;
    if (aT !== bT) return aT - bT;
    return RANK_ORDER[a.rank] - RANK_ORDER[b.rank];
  });

/** Pick an attack or defense move; returns the next Socket event + payload. */
const pickMove = (game, myId, roomId) => {
  if (!game) return null;
  if (game.phase === 'finished') return null;

  const amAttacker = game.attackerId === myId;
  const amDefender = game.defenderId === myId;
  const needsMyConfirmation = (game.pendingConfirmations ?? []).includes(myId);

  // Defender decisions
  if (amDefender) {
    const undefended = game.table.find((p) => !p.defense);
    if (!undefended) return null;
    const candidates = game.you.hand.filter((c) => beats(undefended.attack, c, game.trumpSuit));
    const sorted = cheapestNonTrumpFirst(candidates, game.trumpSuit);
    if (sorted.length > 0) {
      return {
        event: SOCKET_EVENTS.DEFEND_CARD,
        payload: { roomId, attackCardId: undefended.attack.id, defenseCard: sorted[0] },
      };
    }
    return { event: SOCKET_EVENTS.TAKE_CARDS, payload: { roomId } };
  }

  // Bito-Bestätigung (kann sowohl Hauptangreifer als auch Nachbar sein):
  // Wenn ich noch eine günstige passende Karte habe → nachlegen, sonst bestätigen.
  if (needsMyConfirmation) {
    const tableRanks = ranksOnTable(game.table);
    const pileable = game.you.hand.filter((c) => tableRanks.has(c.rank));
    const cheap = cheapestNonTrumpFirst(pileable, game.trumpSuit).find(
      (c) => c.suit !== game.trumpSuit,
    );
    if (cheap) {
      return { event: SOCKET_EVENTS.PLAY_CARD, payload: { roomId, card: cheap } };
    }
    return { event: SOCKET_EVENTS.END_TURN, payload: { roomId } };
  }

  // Hauptangreifer eröffnet eine Runde
  if (amAttacker && game.table.length === 0) {
    const sorted = cheapestNonTrumpFirst(game.you.hand, game.trumpSuit);
    const card = sorted[0];
    if (!card) return null;
    return { event: SOCKET_EVENTS.PLAY_CARD, payload: { roomId, card } };
  }

  // Sonst (z.B. mid-round, gar nicht beteiligt) — warten.
  return null;
};

const log = (...a) => console.log(`[${name}]`, ...a);

const main = async () => {
  log(`connecting to ${HOST}...`);
  const socket = io(HOST, { transports: ['websocket', 'polling'] });
  await new Promise((r) => socket.once('connect', r));
  log('connected, socket id', socket.id);

  const state = { game: null, me: null, roomId: ROOM_ID ?? null, gen: 0 };

  socket.on('gameStateUpdate', async (g) => {
    state.game = g;
    state.gen += 1;
    const myGen = state.gen;

    // First "thinking" delay: short, just to feel human.
    await wait(600 + Math.random() * 600);
    if (state.gen !== myGen) return; // a newer state arrived — this tick is stale

    const move = pickMove(g, state.me?.id, state.roomId);
    if (!move) return;

    // The server now auto-takes when the defender can't beat anything and
    // pile-on is exhausted, so an explicit bot TAKE_CARDS is mostly a
    // belt-and-braces fallback. No extra delay needed — server fires
    // auto-take after the attacker's PLAY_CARD already.

    log('→', move.event, move.payload.card ? `${move.payload.card.rank}${move.payload.card.suit[0].toUpperCase()}` : '');
    try {
      const res = await ack(socket, move.event, move.payload);
      if (!res.ok) log('move rejected:', res.error);
    } catch (e) {
      log('move error:', e.message);
    }
  });

  socket.on('roomListUpdate', (rooms) => {
    // Auto-join the first open lobby room if we haven't picked one yet.
    if (state.roomId) return;
    const open = rooms.find((r) => r.status === 'lobby' && r.players.length < r.maxPlayers);
    if (!open) return;
    state.roomId = open.id;
    log('joining room', open.name, open.id);
    ack(socket, SOCKET_EVENTS.JOIN_ROOM, { roomId: open.id }).catch((e) => log('join fail', e));
  });

  socket.on('errorMessage', (e) => log('server error:', e));
  socket.on('disconnect', (r) => log('disconnected:', r));

  const join = await ack(socket, SOCKET_EVENTS.JOIN_LOBBY, { playerName: name });
  if (!join.ok) {
    log('joinLobby failed:', join.error);
    process.exit(1);
  }
  state.me = { id: join.data.playerId, name };
  log('joined lobby as', state.me.id);

  if (HOST_ROOM) {
    const create = await ack(socket, SOCKET_EVENTS.CREATE_ROOM, {
      name: `${name}'s Bot-Tisch`,
      maxPlayers: 2,
    });
    if (!create.ok) {
      log('create failed:', create.error);
      process.exit(1);
    }
    state.roomId = create.data.room.id;
    log('hosted room', state.roomId, '— waiting for a human player…');
    let started = false;
    socket.on('playerJoined', async (evt) => {
      if (started) return;
      if (evt.roomId !== state.roomId) return;
      if (evt.playerId === state.me?.id) return;
      started = true;
      log('opponent joined, starting in 1s');
      await wait(1000);
      const start = await ack(socket, SOCKET_EVENTS.START_GAME, { roomId: state.roomId });
      if (!start.ok) {
        started = false;
        log('start failed:', start.error);
      }
    });
  } else if (ROOM_ID) {
    log('joining specified room', ROOM_ID);
    const res = await ack(socket, SOCKET_EVENTS.JOIN_ROOM, { roomId: ROOM_ID });
    if (!res.ok) log('join failed:', res.error);
  } else {
    const openRooms = join.data.rooms.filter(
      (r) => r.status === 'lobby' && r.players.length < r.maxPlayers,
    );
    if (openRooms.length > 0) {
      const room = openRooms[0];
      state.roomId = room.id;
      log('auto-joining first open room:', room.name);
      await ack(socket, SOCKET_EVENTS.JOIN_ROOM, { roomId: room.id });
    } else {
      log('no open rooms — waiting (use --host-room to create one)');
    }
  }
};

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
