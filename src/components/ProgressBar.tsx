interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercent?: boolean;
  color?: string;
}

export default function ProgressBar({ value, max, label, showPercent, color }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between text-sm mb-1">
          {label && <span className="text-[var(--color-text-secondary)]">{label}</span>}
          {showPercent && <span className="font-medium">{percent}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color || 'var(--color-primary)' }}
        />
      </div>
    </div>
  );
}
