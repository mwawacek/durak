import { Link } from 'react-router-dom';
import { BrassButton } from '@/components/BrassButton';

export const NotFoundRoute = (): JSX.Element => (
  <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center text-cream safe-pt safe-pb">
    <p className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-gold-light">
      404
    </p>
    <p className="font-display text-4xl text-gold-light/70">♠ · ♦ · ♥ · ♣</p>
    <h1 className="font-serif text-3xl italic text-cream">Seite nicht gefunden</h1>
    <p className="max-w-[28ch] font-serif italic text-cream-dim">
      Vielleicht ist der Tisch schon zu Ende — versuche es in der Lobby.
    </p>
    <Link to="/" className="mt-2">
      <BrassButton variant="primary" label="Zur Lobby" />
    </Link>
  </main>
);
