import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
} as const;

/**
 * Serif heading with the design's signature weight + tracking. Centralises
 * the inline `style={{ fontWeight: 500, letterSpacing: '-0.015em' }}` we
 * otherwise repeat across half a dozen panels.
 */
export const SerifTitle = ({ children, size = 'md', className }: Props): JSX.Element => (
  <h1
    className={cn(
      'font-serif text-text-primary',
      SIZE_CLASSES[size],
      className,
    )}
    style={{ fontWeight: 500, letterSpacing: '-0.015em' }}
  >
    {children}
  </h1>
);
