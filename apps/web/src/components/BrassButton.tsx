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
 * Warm-coral action button. The CTA is the only saturated affordance on the
 * board — secondary actions stay neutral and ghost-styled.
 *
 *  - primary, danger    coral gradient pill (same visual; `danger` kept as
 *                       an alias because callers wired the "Nehmen" button
 *                       to it conceptually)
 *  - secondary          transparent pill with hairline border
 *  - secondary-active   accent-tinted pill (used for toggled "Schieben")
 */
const VARIANT_STYLES: Record<BrassVariant, string> = {
  primary:
    'text-white border-accent-light/40 shadow-cta bg-[linear-gradient(180deg,#ff8a7a_0%,#ff6f5e_50%,#ff5a48_100%)]',
  danger:
    'text-white border-accent-light/40 shadow-cta bg-[linear-gradient(180deg,#ff8a7a_0%,#ff6f5e_50%,#ff5a48_100%)]',
  secondary:
    'text-text-primary border-line-mid bg-white/[0.04] hover:bg-white/[0.06]',
  'secondary-active':
    'text-text-primary border-accent-ring bg-accent-soft',
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
        'relative inline-flex items-center justify-center gap-2 rounded-pill border',
        size === 'lg'
          ? 'min-h-[50px] min-w-[148px] px-7 py-3 text-[13px]'
          : 'min-h-[44px] min-w-[120px] px-5 py-2.5 text-[12.5px]',
        'font-sans font-semibold tracking-[0.04em]',
        'transition-[transform,opacity] duration-150 ease-out active:scale-[0.97]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        VARIANT_STYLES[variant],
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
      {...rest}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined ? (
        <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-pill bg-black/30 px-1.5 text-[10px] font-bold tnum">
          {badge}
        </span>
      ) : null}
    </button>
  );
});
