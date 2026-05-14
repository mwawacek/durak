import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BrassVariant = 'primary' | 'danger' | 'secondary' | 'secondary-active';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  badge?: string | number;
  variant?: BrassVariant;
  icon?: ReactNode;
  size?: 'md' | 'lg';
}

/**
 * Primary action button — "Midnight Velvet" theme.
 *
 * Flat filled buttons with a subtle inner highlight at the top edge (no
 * brass / gradient). Large rounded corners, generous tap targets, bold
 * display label.
 *
 *  - primary           solid crimson with a subtle gloss
 *  - danger            same crimson family; alias kept so callers don't break
 *  - secondary         glass surface with a soft inner border
 *  - secondary-active  glass surface tinted amber (used for toggled state)
 */
const VARIANT_STYLES: Record<BrassVariant, string> = {
  primary:
    'text-white bg-crimson-flat border-crimson-400/70 shadow-crimson hover:brightness-105',
  danger:
    'text-white bg-crimson-flat border-crimson-400/70 shadow-crimson',
  secondary:
    'text-bone glass border-white/10',
  'secondary-active':
    'text-ink-950 bg-amber-flat border-amber-300/80 shadow-amber',
};

export const BrassButton = forwardRef<HTMLButtonElement, Props>(function BrassButton(
  { label, badge, variant = 'primary', icon, size = 'md', className, disabled, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled}
      className={cn(
        // Layout
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-pill border',
        // Sizes (touch-target compliant)
        size === 'lg'
          ? 'min-h-[52px] min-w-[140px] px-7 py-3 text-[13px]'
          : 'min-h-[48px] min-w-[124px] px-6 py-2.5 text-[12px]',
        // Type
        'font-display font-semibold uppercase tracking-[0.14em]',
        // Interaction (touch-first — :active + focus-visible)
        'transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone',
        // Inner highlight stripe via ::before
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:rounded-t-pill before:bg-gradient-to-b before:from-white/25 before:to-transparent',
        VARIANT_STYLES[variant],
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
      {...rest}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
      {badge !== undefined ? (
        <span className="absolute -right-1 -top-1 z-10 inline-flex h-5 min-w-[20px] items-center justify-center rounded-pill border border-white/30 bg-ink-950 px-1.5 text-[10px] font-bold text-white tnum">
          {badge}
        </span>
      ) : null}
    </button>
  );
});
