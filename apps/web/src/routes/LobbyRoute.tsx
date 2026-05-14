import { useGameStore } from '@/store/gameStore';
import { NameEntryModal } from '@/components/NameEntryModal';
import { LobbyPage } from '@/features/lobby/LobbyPage';

export const LobbyRoute = (): JSX.Element => {
  const playerName = useGameStore((s) => s.playerName);
  if (!playerName) return <NameEntryModal reason="lobby" />;
  return <LobbyPage />;
};
