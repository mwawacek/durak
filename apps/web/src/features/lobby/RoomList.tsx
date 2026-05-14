import { motion } from 'framer-motion';
import type { RoomPublic } from '@durak/shared';
import { RoomRow } from './RoomRow';

interface Props {
  rooms: RoomPublic[];
  onJoin: (room: RoomPublic) => void;
  joinPending: boolean;
}

export const RoomList = ({ rooms, onJoin, joinPending }: Props): JSX.Element => {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-panel border border-dashed border-line-mid px-5 py-10 text-center">
        <p className="font-serif text-lg text-text-primary" style={{ fontWeight: 500 }}>
          Keine offenen Tische
        </p>
        <p className="max-w-[32ch] font-sans text-sm text-text-secondary">
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <RoomRow room={room} onJoin={() => onJoin(room)} disabled={joinPending} />
        </motion.li>
      ))}
    </ul>
  );
};
