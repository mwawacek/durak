import { Link } from 'react-router-dom';
import { BrassButton } from './BrassButton';
import { SerifTitle } from './SerifTitle';

interface Props {
  title: string;
  sub?: string;
  body?: string;
  /** When set, renders a "Zur Lobby" CTA below the message. */
  showLobbyLink?: boolean;
}

/**
 * Full-screen status / placeholder / error message. Used by RoomRoute,
 * NotFoundRoute, and the connecting / waiting / not-found branches.
 */
export const StatusScreen = ({ title, sub, body, showLobbyLink }: Props): JSX.Element => (
  <main className="flex h-dvh flex-col items-center justify-center gap-3 px-6 text-center text-text-primary safe-pt safe-pb">
    <SerifTitle size="md">{title}</SerifTitle>
    {sub ? <p className="font-sans text-sm text-text-secondary">{sub}</p> : null}
    {body ? (
      <p className="max-w-[32ch] font-sans text-sm text-text-secondary">{body}</p>
    ) : null}
    {showLobbyLink ? (
      <Link to="/" className="mt-2">
        <BrassButton variant="primary" label="Zur Lobby" />
      </Link>
    ) : null}
  </main>
);
