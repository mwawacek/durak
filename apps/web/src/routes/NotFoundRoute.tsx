import { Link } from 'react-router-dom';
import { BrassButton } from '@/components/BrassButton';

export const NotFoundRoute = (): JSX.Element => (
  <main className="flex h-dvh flex-col items-center justify-center gap-3 px-6 text-center text-text-primary safe-pt safe-pb">
    <span className="label-eyebrow">404</span>
    <h1
      className="font-serif text-3xl text-text-primary"
      style={{ fontWeight: 500, letterSpacing: '-0.015em' }}
    >
      Seite nicht gefunden
    </h1>
    <p className="max-w-[32ch] font-sans text-sm text-text-secondary">
      Vielleicht ist der Tisch schon zu Ende. Schau in der Lobby vorbei.
    </p>
    <Link to="/" className="mt-2">
      <BrassButton variant="primary" size="lg" label="Zur Lobby" />
    </Link>
  </main>
);
