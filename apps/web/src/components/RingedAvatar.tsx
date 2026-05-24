import { cn } from '@/lib/cn';

interface Props {
  initials: string;
  active?: boolean;
  size?: number;
  className?: string;
}

/**
 * Round monogram avatar. When `active`, the background flips to the coral
 * accent gradient with dark ink text; otherwise neutral on translucent
 * white.
 */
export const RingedAvatar = ({
  initials,
  active = false,
  size = 30,
  className,
}: Props): JSX.Element => (
  <span
    className={cn(
      'inline-flex items-center justify-center rounded-full font-sans font-semibold',
      active ? 'text-bg-base' : 'text-text-primary',
      className,
    )}
    style={{
      width: size,
      height: size,
      fontSize: size * 0.42,
      background: active
        ? 'linear-gradient(135deg, #ff8a7a 0%, #ff6f5e 100%)'
        : 'rgba(255,255,255,0.08)',
      border: active ? 'none' : '0.5px solid rgba(255,255,255,0.14)',
    }}
  >
    {initials}
  </span>
);
