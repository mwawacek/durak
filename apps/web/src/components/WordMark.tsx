interface Props {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-6xl',
} as const;

/**
 * Brand wordmark — Bricolage Grotesque at wide width / extra bold, with a
 * white-to-crimson gradient via background-clip. Used in the lobby header,
 * the name-entry modal, and the game-over dialog.
 */
export const WordMark = ({ size = 'lg' }: Props): JSX.Element => (
  <span
    className={`bg-clip-text font-display uppercase tracking-[-0.02em] text-transparent ${SIZES[size]}`}
    style={{
      WebkitBackgroundClip: 'text',
      fontVariationSettings: '"wdth" 95, "wght" 800',
      backgroundImage: 'linear-gradient(180deg, #fff 0%, #fafaf7 35%, #ff5572 100%)',
    }}
  >
    Durak
  </span>
);
