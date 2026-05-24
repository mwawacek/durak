import { useEffect, useId, useRef, type ReactNode } from 'react';
import { m } from 'framer-motion';
import { EASE_OUT_EXPO } from '@/lib/motion';
import { cn } from '@/lib/cn';

interface Props {
  children: ReactNode;
  onClose?: () => void;
  /** Accessible label — typically the modal's headline. */
  labelledById?: string;
  /** Centred sheet (default) or bottom-anchored sheet that fills width on mobile. */
  variant?: 'centred' | 'bottom-sheet';
  /** Tap on the backdrop dismisses (only if `onClose` is provided). */
  dismissOnBackdrop?: boolean;
}

/**
 * Modal scaffold: dimmed backdrop with backdrop-blur, Framer-Motion entrance,
 * keyboard accessibility (Escape closes, focus restored to opener), and
 * proper ARIA wiring. Children render inside a glass-card container.
 *
 * Without `onClose`, the modal is non-dismissable (used for the name-entry
 * gate where the user must enter a name).
 */
export const ModalShell = ({
  children,
  onClose,
  labelledById,
  variant = 'centred',
  dismissOnBackdrop = true,
}: Props): JSX.Element => {
  const fallbackId = useId();
  const labelId = labelledById ?? fallbackId;
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement;
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [onClose]);

  const wrapperClass =
    variant === 'bottom-sheet'
      ? 'mt-auto w-full px-3 pb-3 sm:mt-0 sm:m-auto sm:max-w-md sm:p-6'
      : 'm-auto w-full max-w-sm px-6';
  const motionInitial = variant === 'bottom-sheet' ? { opacity: 0, y: 80 } : { opacity: 0, scale: 0.94, y: 12 };
  const motionAnimate = { opacity: 1, y: 0, scale: 1 };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      className={cn(
        'fixed inset-0 z-50 flex flex-col bg-bg-base/85 backdrop-blur-md',
        // pb-[max(0.75rem,env(...))] ensures we still leave a buffer on phones
        // without a home indicator, where safe-pb resolves to 0.
        variant === 'bottom-sheet' &&
          'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]',
      )}
      onClick={dismissOnBackdrop && onClose ? onClose : undefined}
    >
      <m.div
        onClick={(e) => e.stopPropagation()}
        className={wrapperClass}
        initial={motionInitial}
        animate={motionAnimate}
        transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
      >
        {/* Drag handle for bottom-sheet variant — visual affordance on mobile. */}
        {variant === 'bottom-sheet' ? (
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line-mid sm:hidden" />
        ) : null}
        {children}
      </m.div>
    </div>
  );
};
