import { cn } from '@/lib/cn';

interface Props {
  initials: string;
  active?: boolean;
  size?: number;
  className?: string;
}

/**
 * Gold-rimmed circular avatar with the player's initial. The active state
 * (it's your turn or you owe a Bito) swaps a dim brown gradient for a warm
 * gold-on-brown one + a brighter ring.
 */
export const RingedAvatar = ({
  initials,
  active = false,
  size = 28,
  className,
}: Props): JSX.Element => {
  const gradient = active
    ? 'linear-gradient(135deg, #f0d68f 0%, #b88a3a 100%)'
    : 'linear-gradient(135deg, #4a3520 0%, #2a1f12 100%)';
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-serif font-extrabold',
        active ? 'border-[1.5px] border-gold-light' : 'border border-gold/40',
        className,
      )}
      style={{
        width: size,
        height: size,
        color: active ? '#1a0905' : '#e6c478',
        fontSize: size * 0.42,
        background: gradient,
      }}
    >
      {initials}
    </span>
  );
};
