import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { attachSocketHandlers, } from '@/services/socketHandlers';
import { getSocket } from '@/services/socket';
import { useNamePersistence } from '@/hooks/useNamePersistence';
import { useLobbyJoin } from '@/hooks/useLobbyJoin';
import { Toast } from '@/components/Toast';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { LobbyRoute } from '@/routes/LobbyRoute';
import { RoomRoute } from '@/routes/RoomRoute';
import { NotFoundRoute } from '@/routes/NotFoundRoute';

export const App = (): JSX.Element => {
  useNamePersistence();
  useLobbyJoin();

  useEffect(() => {
    attachSocketHandlers();
    // Eagerly create the singleton so the initial connect cycle starts before
    // any user input. Idempotent (returns the cached socket).
    getSocket();
  }, []);

  return (
    <BrowserRouter>
      <Toast />
      <ConnectionBadge />
      <Routes>
        <Route path="/" element={<LobbyRoute />} />
        <Route path="/lobby" element={<Navigate to="/" replace />} />
        <Route path="/r/:roomId" element={<RoomRoute />} />
        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
    </BrowserRouter>
  );
};

/**
 * Distinctive wordmark — variable Bricolage Grotesque at wide width / extra-bold.
 * Crimson-to-bone gradient text so it carries the "Midnight Velvet" identity.
 */
export const WordMark = ({
  size = 'lg',
}: {
  size?: 'sm' | 'md' | 'lg';
}): JSX.Element => {
  const sizes = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-6xl',
  } as const;
  return (
    <span
      className={`bg-clip-text font-display uppercase tracking-[-0.02em] text-transparent ${sizes[size]}`}
      style={{
        WebkitBackgroundClip: 'text',
        fontVariationSettings: '"wdth" 95, "wght" 800',
        backgroundImage:
          'linear-gradient(180deg, #fff 0%, #fafaf7 35%, #ff5572 100%)',
      }}
    >
      Durak
    </span>
  );
};
