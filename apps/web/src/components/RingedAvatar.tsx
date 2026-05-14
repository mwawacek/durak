import { cn } from '@/lib/cn';

interface Props {
  initials: string;
  active?: boolean;
  size?: number;
  tone?: 'neutral' | 'attacker' | 'defender';
  className?: string;
}

/**
 * Circular initial avatar — "Midnight Velvet" version.
 * Tone tints the gradient and the ring colour so seats read at a glance:
 *  - neutral    glass blue
 *  - attacker   crimson
 *  - defender   mint
 * Active state widens the ring and brightens the foreground.
 */
export const RingedAvatar = ({
  initials,
  active = false,
  size = 32,
  tone = 'neutral',
  className,
}: Props): JSX.Element => {
  const tones = {
    neutral: {
      gradient: 'linear-gradient(135deg, #243054 0%, #0e1424 100%)',
      activeGradient: 'linear-gradient(135deg, #5eead4 0%, #06b6d4 100%)',
      ring: 'border-white/20',
      activeRing: 'border-mint-400',
      activeColor: '#06080f',
      idleColor: '#e7e5e0',
    },
    attacker: {
      gradient: 'linear-gradient(135deg, #7c1729 0%, #2a0a14 100%)',
      activeGradient: 'linear-gradient(135deg, #ff5572 0%, #b8243e 100%)',
      ring: 'border-crimson-500/50',
      activeRing: 'border-crimson-400',
      activeColor: '#fff',
      idleColor: '#ffd9e0',
    },
    defender: {
      gradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
      activeGradient: 'linear-gradient(135deg, #5eead4 0%, #10b981 100%)',
      ring: 'border-mint-500/50',
      activeRing: 'border-mint-400',
      activeColor: '#06080f',
      idleColor: '#6ee7b7',
    },
  } as const;
  const t = tones[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-display font-bold',
        active ? `${t.activeRing} border-[1.5px]` : `${t.ring} border`,
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        color: active ? t.activeColor : t.idleColor,
        background: active ? t.activeGradient : t.gradient,
        boxShadow: active ? '0 0 0 2px rgba(255,255,255,0.05)' : undefined,
      }}
    >
      {initials}
    </span>
  );
};
