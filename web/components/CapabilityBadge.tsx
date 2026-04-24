interface Props {
  capability: string;
}

export default function CapabilityBadge({ capability }: Props) {
  const base = "px-2 py-1 rounded-full text-xs font-medium border ";
  const styles: Record<string, string> = {
    'llm-inference': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'video-generation': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'image-generation': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    'audio': 'bg-green-500/20 text-green-300 border-green-500/30',
    'manim': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'default': 'bg-gray-800 text-gray-300 border-gray-600',
  };
  const style = styles[capability] || styles.default;
  return <span className={`${base}${style}`}>{capability}</span>;
}
