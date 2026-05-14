import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SOCKET_EVENTS,
  MIN_PLAYERS,
  type CreateRoomResult,
  type JoinRoomResult,
  type RoomPublic,
} from '@durak/shared';
import { useGameStore } from '@/store/gameStore';
import { emitAckOrToast } from '@/services/socket';
import { BrassButton } from '@/components/BrassButton';
import { RoomList } from './RoomList';
import { MyRoomPanel } from './MyRoomPanel';
import { CreateRoomDialog } from './CreateRoomDialog';

export const LobbyPage = (): JSX.Element => {
  const navigate = useNavigate();
  const rooms = useGameStore((s) => s.rooms);
  const playerId = useGameStore((s) => s.playerId);
  const playerName = useGameStore((s) => s.playerName);
  const connected = useGameStore((s) => s.connected);
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);

  const [creating, setCreating] = useState(false);
  const [joinPending, setJoinPending] = useState(false);

  const myRoom = rooms.find((r) => r.players.some((p) => p.id === playerId));
  const openRooms = rooms.filter((r) => r.status === 'lobby' && r.id !== myRoom?.id);

  // Auto-navigate into a room as soon as it transitions to in-game (because the
  // host pressed Start). Also handles the case where we joined a room and the
  // server flips its status while we're on this screen.
  useEffect(() => {
    if (!myRoom) return;
    if (myRoom.status === 'in-game') {
      setCurrentRoom(myRoom.id);
      navigate(`/r/${myRoom.id}`, { replace: true });
    }
  }, [myRoom, navigate, setCurrentRoom]);

  const handleCreate = async (name: string, maxPlayers: number) => {
    const data = await emitAckOrToast<CreateRoomResult>(SOCKET_EVENTS.CREATE_ROOM, {
      name: name.trim() || `${playerName}'s Tisch`,
      maxPlayers,
    });
    if (!data) return;
    setCurrentRoom(data.room.id);
    setCreating(false);
    navigate(`/r/${data.room.id}`);
  };

  const handleJoin = async (room: RoomPublic) => {
    if (joinPending) return;
    setJoinPending(true);
    const data = await emitAckOrToast<JoinRoomResult>(SOCKET_EVENTS.JOIN_ROOM, {
      roomId: room.id,
    });
    setJoinPending(false);
    if (!data) return;
    setCurrentRoom(room.id);
    navigate(`/r/${room.id}`);
  };

  return (
    <div className="relative flex min-h-dvh flex-col text-cream safe-pt safe-pb">
      <header className="flex items-end justify-between gap-3 px-5 pt-8">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-gold-light">
            Lobby
          </p>
          <h1 className="mt-1 font-serif text-3xl italic leading-tight text-cream">
            {playerName ?? '…'}
          </h1>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.25em] text-cream-dim">
            Wähle einen Tisch.
          </p>
        </div>
        <div className="pb-1">
          <BrassButton
            variant="primary"
            label="Neuer Tisch"
            onClick={() => setCreating(true)}
            disabled={!connected}
          />
        </div>
      </header>

      <div className="mx-5 mt-5 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <main className="scroll-touch flex flex-1 flex-col gap-6 overflow-y-auto px-5 pb-8 pt-5">
        {myRoom ? <MyRoomPanel room={myRoom} /> : null}

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-gold-light">
            Offene Tische
          </h2>
          <RoomList
            rooms={openRooms}
            onJoin={handleJoin}
            joinPending={joinPending}
            minPlayers={MIN_PLAYERS}
          />
        </section>
      </main>

      {creating ? (
        <CreateRoomDialog
          onCancel={() => setCreating(false)}
          onCreate={handleCreate}
          defaultName={playerName ? `${playerName}'s Tisch` : 'Mein Tisch'}
        />
      ) : null}
    </div>
  );
};
