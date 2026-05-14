interface Props {
  count: number;
}

export const DiscardIndicator = ({ count }: Props): JSX.Element => (
  <div className="flex flex-col items-center gap-1.5">
    <p className="font-display text-[9px] font-bold uppercase tracking-[0.3em] text-bone-mute">
      Abwurf
    </p>
    <div className="glass-bare flex items-center rounded-pill px-3 py-1">
      <span className="font-mono text-[11px] font-bold text-bone tnum">{count}</span>
    </div>
  </div>
);
