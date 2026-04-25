interface Reputation {
  reliability: number;
  speed: number;
  quality: number;
  costEfficiency: number;
}

interface Props {
  reputation: Reputation;
}

export default function ReputationBar({ reputation }: Props) {
  const cats = [
    { key: 'reliability', label: 'Reliability', value: reputation.reliability },
    { key: 'speed', label: 'Speed', value: reputation.speed },
    { key: 'quality', label: 'Quality', value: reputation.quality },
    { key: 'costEfficiency', label: 'Cost Efficiency', value: reputation.costEfficiency },
  ] as const;

  const barColor = (v: number) =>
    v >= 8 ? 'bg-ritual-green' : v >= 5 ? 'bg-ritual-gold' : 'bg-red-500';

  return (
    <div className="space-y-3" role="list" aria-label="Reputation scores">
      {cats.map(({ key, label, value }) => (
        <div key={key} role="listitem">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-400">{label}</span>
            <span className="text-ritual-lime font-mono">{value.toFixed(1)}</span>
          </div>
          <div
            className="h-1.5 bg-gray-800 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-label={`${label}: ${value.toFixed(1)} out of 10`}
          >
            <div
              className={`h-full ${barColor(value)} transition-all duration-500`}
              style={{ width: `${value * 10}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
