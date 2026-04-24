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

  const color = (v: number) => v >= 8 ? 'bg-green-500' : v >= 5 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-3">
      {cats.map(({ key, label, value }) => (
        <div key={key}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">{label}</span>
            <span className="text-[#C8FF00] font-mono">{value.toFixed(1)}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full ${color(value)} transition-all`} style={{ width: `${value * 10}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
