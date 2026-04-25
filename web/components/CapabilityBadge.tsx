interface Props {
  capability: string;
}

// Pink = AI/inference precompiles, Green = data/utility, Gold = scheduling
const styles: Record<string, string> = {
  'llm-inference':      'bg-ritual-pink/10 text-ritual-pink border-ritual-pink/20',
  'video-generation':   'bg-ritual-pink/10 text-ritual-pink border-ritual-pink/20',
  'image-generation':   'bg-ritual-pink/10 text-ritual-pink border-ritual-pink/20',
  'audio':              'bg-ritual-pink/10 text-ritual-pink border-ritual-pink/20',
  'multimodal':         'bg-ritual-pink/10 text-ritual-pink border-ritual-pink/20',
  'stable-diffusion':   'bg-ritual-pink/10 text-ritual-pink border-ritual-pink/20',
  'whisper':            'bg-ritual-pink/10 text-ritual-pink border-ritual-pink/20',
  'transcription':      'bg-ritual-pink/10 text-ritual-pink border-ritual-pink/20',
  'text-gen':           'bg-ritual-pink/10 text-ritual-pink border-ritual-pink/20',
  'embedding':          'bg-ritual-green/10 text-ritual-green border-ritual-green/20',
  'http':               'bg-ritual-green/10 text-ritual-green border-ritual-green/20',
  'oracle':             'bg-ritual-green/10 text-ritual-green border-ritual-green/20',
  'testing':            'bg-ritual-green/10 text-ritual-green border-ritual-green/20',
  'manim':              'bg-ritual-lime/10 text-ritual-lime border-ritual-lime/20',
  'telegram-notify':    'bg-ritual-gold/10 text-ritual-gold border-ritual-gold/20',
};

export default function CapabilityBadge({ capability }: Props) {
  const style = styles[capability] ?? 'bg-gray-800 text-gray-400 border-gray-700';
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${style}`}>
      {capability}
    </span>
  );
}
