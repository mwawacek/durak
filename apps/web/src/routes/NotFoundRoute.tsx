import { Link } from 'react-router-dom';
import { BrassButton } from '@/components/BrassButton';

export const NotFoundRoute = (): JSX.Element => (
  <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center text-bone safe-pt safe-pb">
    <p className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-bone-mute">
      404
    </p>
    <h1
      className="font-display text-4xl leading-tight text-bone"
      style={{ fontVariationSettings: '"wdth" 95, "wght" 800' }}
    >
      Hier ist nichts
    </h1>
    <p className="max-w-[32ch] font-sans text-sm text-bone-mute">
      Vielleicht ist der Tisch schon zu Ende. Schau in der Lobby vorbei.
    </p>
    <Link to="/" className="mt-2">
      <BrassButton variant="primary" size="lg" label="Zur Lobby" />
    </Link>
  </main>
);
