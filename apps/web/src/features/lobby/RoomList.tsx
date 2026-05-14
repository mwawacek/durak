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
      <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-gold/25 bg-mahogany-dark/30 px-4 py-8 text-center">
        <span className="font-display text-2xl text-gold-light/70 tracking-[0.4em]">♠ · ♥</span>
        <p className="font-serif text-base italic text-cream">Noch keine Tische offen.</p>
        <p className="max-w-[28ch] text-[12px] leading-relaxed text-cream-dim">
          Eröffne einen neuen Tisch oder warte, bis jemand anders eintritt.
        </p>
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
