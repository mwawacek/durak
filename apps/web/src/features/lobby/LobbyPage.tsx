import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  SOCKET_EVENTS,
  type CreateRoomResult,
  type JoinRoomResult,
  type RoomPublic,
} from '@durak/shared';
import { useGameStore } from '@/store/gameStore';
import { emitAckOrToast } from '@/services/socket';
import { BrassButton } from '@/components/BrassButton';
import { WordMark } from '@/components/WordMark';
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

  useEffect(() => {
    if (myRoom?.status === 'in-game') {
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
    <div className="relative flex h-dvh flex-col text-text-primary safe-pt safe-pb">
      <header className="px-5 pt-10">
        <span className="label-eyebrow">Hallo, {playerName ?? '…'}</span>
        <div className="mt-2">
          <WordMark size="md" />
        </div>
        <p className="mt-1 font-sans text-sm text-text-secondary">
          Wähle einen Tisch oder eröffne deinen eigenen.
        </p>
      </header>

      <main className="scroll-touch flex flex-1 flex-col gap-6 overflow-y-auto px-5 pb-28 pt-7">
        {myRoom ? <MyRoomPanel room={myRoom} /> : null}

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="label-eyebrow">Offene Tische</h2>
            <span className="font-mono text-[10px] text-text-tertiary tnum">
              {openRooms.length}
            </span>
          </div>
          <RoomList rooms={openRooms} onJoin={handleJoin} joinPending={joinPending} />
        </section>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-5 pb-6 safe-pb">
        <div className="pointer-events-auto">
          <BrassButton
            variant="primary"
            size="lg"
            label="Neuer Tisch"
            icon={<Plus size={16} strokeWidth={2.5} />}
            onClick={() => setCreating(true)}
            disabled={!connected}
          />
        </div>
      </div>

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
