import { Link } from 'react-router-dom';
import { BrassButton } from '@/components/BrassButton';

export const NotFoundRoute = (): JSX.Element => (
  <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-cream">
    <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold-light">404</p>
    <h1 className="font-serif text-3xl italic text-cream">Seite nicht gefunden</h1>
    <Link to="/">
      <BrassButton variant="primary" label="Zur Lobby" />
    </Link>
  </main>
);
