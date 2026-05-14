interface Props {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
} as const;

/**
 * Wordmark — serif italic-leaning display with a soft coral accent dot.
 * Used in the lobby and the name-entry modal.
 */
export const WordMark = ({ size = 'lg' }: Props): JSX.Element => (
  <span
    className={`inline-flex items-baseline gap-1.5 font-serif text-text-primary ${SIZES[size]}`}
    style={{ letterSpacing: '-0.02em', fontWeight: 500 }}
  >
    <span>Durak</span>
    <span
      className="inline-block rounded-full bg-accent"
      style={{ width: '0.22em', height: '0.22em' }}
    />
  </span>
);
