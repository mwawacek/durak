import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import { attachSocketHandlers } from '@/services/socketHandlers';
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
    // Eager singleton so the initial connect cycle starts before any user
    // input. Idempotent.
    getSocket();
  }, []);

  return (
    // LazyMotion + the lightweight `m.*` components (used via `m` import in
    // child files) trim ~20 KB off the framer-motion bundle vs the eager
    // `motion.*` factory.
    <LazyMotion features={domAnimation} strict>
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
    </LazyMotion>
  );
};
