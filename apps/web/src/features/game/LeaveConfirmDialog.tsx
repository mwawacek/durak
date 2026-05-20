import { useId } from 'react';
import { BrassButton } from '@/components/BrassButton';
import { SerifTitle } from '@/components/SerifTitle';
import { ModalShell } from '@/components/ModalShell';

interface Props {
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export const LeaveConfirmDialog = ({ onCancel, onConfirm }: Props): JSX.Element => {
  const titleId = useId();
  return (
    <ModalShell onClose={onCancel} variant="bottom-sheet" labelledById={titleId}>
      <div className="rounded-sheet border border-line-mid bg-bg-card p-6 sm:p-7">
        <span className="label-eyebrow">Tisch verlassen</span>
        <SerifTitle id={titleId} size="md" className="mt-1">
          Spiel beenden?
        </SerifTitle>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          Wenn du gehst, endet die Runde für alle am Tisch.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <BrassButton variant="secondary" label="Bleiben" onClick={onCancel} />
          <BrassButton variant="primary" size="lg" label="Verlassen" onClick={onConfirm} />
        </div>
      </div>
    </ModalShell>
  );
};
