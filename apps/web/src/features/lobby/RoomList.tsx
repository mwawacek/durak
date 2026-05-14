import type { RoomPublic } from '@durak/shared';
import { RoomRow } from './RoomRow';

interface Props {
  rooms: RoomPublic[];
  onJoin: (room: RoomPublic) => void;
  joinPending: boolean;
  minPlayers: number;
}

export const RoomList = ({ rooms, onJoin, joinPending }: Props): JSX.Element => {
  if (rooms.length === 0) {
    return (
      <div className="rounded-card border border-gold/20 bg-mahogany-dark/40 px-4 py-6 text-center text-sm italic text-cream-dim">
        Keine offenen Tische. Erstelle einen neuen.
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {rooms.map((room) => (
        <li key={room.id}>
          <RoomRow room={room} onJoin={() => onJoin(room)} disabled={joinPending} />
        </li>
      ))}
    </ul>
  );
};
