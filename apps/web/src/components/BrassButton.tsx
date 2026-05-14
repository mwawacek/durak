import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BrassVariant = 'primary' | 'danger' | 'secondary' | 'secondary-active';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  badge?: string | number;
  variant?: BrassVariant;
  icon?: ReactNode;
}

/**
 * The "Brass"-style action button — gradient fill, gold border, oval shape.
 * Mirrors apps/mobile's BrassButton variants. Touch targets are 44 px tall
 * (Apple HIG) via `min-h-11`, with `:active` opacity for tap feedback so the
 * button works correctly on touch devices without relying on :hover.
 */
const VARIANT_STYLES: Record<BrassVariant, string> = {
  primary:
    'bg-gradient-to-b from-gold-highlight via-gold to-gold-deep text-ink border-[rgba(255,225,160,0.85)] shadow-brass',
  danger:
    'bg-gradient-to-b from-red-bright via-red-deep to-red-darkest text-cream-soft border-red/70 shadow-card',
  secondary:
    'bg-gradient-to-b from-[rgba(40,28,18,0.85)] via-[rgba(15,8,4,0.9)] to-[rgba(15,8,4,0.95)] text-gold-light border-gold/55 shadow-card',
  'secondary-active':
    'bg-gradient-to-b from-gold via-red-deep to-[#3a0c0b] text-cream-soft border-gold-highlight shadow-card',
};

const VARIANT_SHEEN: Record<BrassVariant, string> = {
  primary:
    'before:bg-[linear-gradient(180deg,rgba(255,250,220,0.55)_0%,rgba(255,250,220,0)_45%,rgba(0,0,0,0.15)_100%)]',
  danger:
    'before:bg-[linear-gradient(180deg,rgba(255,200,180,0.18)_0%,rgba(255,200,180,0)_45%,rgba(0,0,0,0.25)_100%)]',
  secondary:
    'before:bg-[linear-gradient(180deg,rgba(212,165,72,0.18)_0%,rgba(212,165,72,0)_50%,rgba(0,0,0,0.35)_100%)]',
  'secondary-active':
    'before:bg-[linear-gradient(180deg,rgba(255,225,160,0.35)_0%,rgba(255,225,160,0)_50%,rgba(0,0,0,0.25)_100%)]',
};

export const BrassButton = forwardRef<HTMLButtonElement, Props>(function BrassButton(
  { label, badge, variant = 'primary', icon, className, disabled, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled}
      className={cn(
        // Layout
        'group relative inline-flex min-h-11 min-w-[120px] items-center justify-center gap-2 overflow-hidden rounded-pill border px-6 py-2.5',
        // Type
        'font-display text-[12px] font-bold uppercase tracking-[0.18em]',
        // Interaction
        'transition-all duration-150 ease-out active:scale-[0.97] active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light',
        // Sheen ::before adds a subtle vertical highlight stripe like brushed brass
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-pill before:opacity-90',
        VARIANT_STYLES[variant],
        VARIANT_SHEEN[variant],
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      {...rest}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
      {badge !== undefined ? (
        <span className="absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-pill border border-gold-light bg-ink px-1.5 text-[10px] font-extrabold text-gold-light">
          {badge}
        </span>
      ) : null}
    </button>
  );
});
