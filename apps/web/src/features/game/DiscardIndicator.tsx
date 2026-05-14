interface Props {
  count: number;
}

export const DiscardIndicator = ({ count }: Props): JSX.Element => (
  <div className="flex flex-col items-center gap-1">
    <p className="font-serif text-[8px] font-bold uppercase tracking-widest text-gold-light">
      Abwurf
    </p>
    <div className="flex items-center gap-1 rounded-pill border border-gold/40 bg-mahogany-dark/70 px-2.5 py-1">
      <span className="text-xs font-bold text-gold-light">{count}</span>
    </div>
  </div>
);
