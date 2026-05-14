import { useGameStore } from '@/store/gameStore';
import { useBootReconnect } from '@/hooks/useBootReconnect';
import { NameEntryModal } from '@/components/NameEntryModal';
import { LobbyPage } from '@/features/lobby/LobbyPage';

export const LobbyRoute = (): JSX.Element => {
  const playerName = useGameStore((s) => s.playerName);
  useBootReconnect();
  if (!playerName) return <NameEntryModal reason="lobby" />;
  return <LobbyPage />;
};
