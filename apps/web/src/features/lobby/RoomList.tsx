import { motion } from 'framer-motion';
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
      <div className="glass-bare flex flex-col items-center gap-3 rounded-card px-5 py-10 text-center">
        <span className="font-display text-3xl text-bone-ghost tracking-[0.3em]">·   ·   ·</span>
        <p className="font-display text-lg text-bone">Keine offenen Tische</p>
        <p className="max-w-[32ch] font-sans text-sm text-bone-mute">
          Eröffne einen neuen oder warte, bis jemand einen Tisch aufmacht.
        </p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {rooms.map((room, i) => (
        <motion.li
          key={room.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <RoomRow room={room} onJoin={() => onJoin(room)} disabled={joinPending} />
        </motion.li>
      ))}
    </ul>
  );
};
