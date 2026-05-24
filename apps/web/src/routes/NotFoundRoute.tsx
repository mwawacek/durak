import { StatusScreen } from '@/components/StatusScreen';

export const NotFoundRoute = (): JSX.Element => (
  <StatusScreen
    title="Seite nicht gefunden"
    body="Vielleicht ist der Tisch schon zu Ende. Schau in der Lobby vorbei."
    showLobbyLink
  />
);
