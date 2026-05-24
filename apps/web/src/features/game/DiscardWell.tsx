import { Card } from '@/components/Card';

interface Props {
  count: number;
}

/**
 * Mirror of TrumpWell on the right side: discard count + two rotated card
 * backs as a visual cue.
 */
export const DiscardWell = ({ count }: Props): JSX.Element => (
  <div className="flex flex-col items-end gap-1">
    <span className="label-eyebrow">Abwurf</span>
    <div className="flex items-center gap-2.5">
      <div className="flex flex-col items-end leading-none">
        <span className="font-serif text-[18px] font-medium tnum">{count}</span>
        <span className="label-eyebrow mt-1">Karten</span>
      </div>
      <div className="relative" style={{ width: 38, height: 38 }}>
        <div className="absolute" style={{ left: 0, top: 4, transform: 'rotate(-8deg)' }}>
          <Card card={null} faceDown width={26} />
        </div>
        <div className="absolute" style={{ left: 8, top: 0, transform: 'rotate(6deg)' }}>
          <Card card={null} faceDown width={26} />
        </div>
      </div>
    </div>
  </div>
);
