interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export function LoadingScreen({ message = '加载中...', subMessage }: LoadingScreenProps) {
  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #2c160e 0%, #3a1f14 40%, #26120b 100%)' }}
    >
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '80%',
          height: '80%',
          maxWidth: 400,
          maxHeight: 400,
          background: '#775a19',
          opacity: 0.05,
          filter: 'blur(120px)',
        }}
      />

      <h2
        className="italic text-xl tracking-wide mb-6 relative z-10"
        style={{
          color: '#ffdea5',
          fontFamily: "'Newsreader', serif",
          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        }}
      >
        {message}
      </h2>

      <div
        className="w-[80%] max-w-[240px] h-3 rounded-full relative overflow-hidden"
        style={{
          background: '#1a0f0a',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div
          className="h-full rounded-full animate-pulse"
          style={{
            width: '60%',
            background: 'linear-gradient(90deg, #775a19, #e9c176, #775a19)',
            boxShadow: '0 0 10px rgba(233,193,118,0.5)',
          }}
        >
          <div className="absolute inset-0 border-t border-white/20 rounded-full" />
        </div>
      </div>

      {subMessage && (
        <p
          className="text-sm mt-3 tracking-wide font-medium relative z-10"
          style={{
            color: '#dac2b6',
            opacity: 0.7,
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          {subMessage}
        </p>
      )}
    </div>
  );
}
