import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, WifiOff, RotateCw, ArrowRight } from 'lucide-react';

interface OfflineBannerProps {
  /** Checks the backend; resolves once the check finishes (whatever the result). */
  onRetry: () => Promise<unknown>;
  retryEverySeconds?: number;
}

/** Shown while the backend can't be reached. Re-checks it on a countdown, or right away on "Force Retry". */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onRetry, retryEverySeconds = 5 }) => {
  const [countdown, setCountdown] = useState(retryEverySeconds);
  const [isRetrying, setIsRetrying] = useState(false);
  const onRetryRef = useRef(onRetry);
  onRetryRef.current = onRetry;

  const retry = async () => {
    setIsRetrying(true);
    try {
      await onRetryRef.current();
    } finally {
      setIsRetrying(false);
      setCountdown(retryEverySeconds);
    }
  };

  useEffect(() => {
    if (isRetrying) return;
    if (countdown <= 0) {
      void retry();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, isRetrying]);

  return (
    <div className="w-full bg-[#FFFBEB] border-b border-[#FDE68A] text-[#1C1D1B] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 text-[11px] sm:text-xs select-none sticky top-0 z-40 transition-colors">
      {/* Left Warning Section */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <span className="w-2 h-2 rounded-full bg-[#B57614] animate-pulse shrink-0"></span>
        <WifiOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B57614] shrink-0" />
        <span className="font-bold text-[#1C1D1B] flex items-center gap-1.5 truncate">
          <AlertTriangle className="w-3.5 h-3.5 text-[#B57614] stroke-[2.2] hidden sm:inline shrink-0" />
          <span className="truncate">Server offline. Reconnecting...</span>
        </span>
      </div>

      {/* Middle Status Info in Monospace */}
      <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] text-[#656860] shrink-0">
        <span>
          {isRetrying ? (
            'Checking now...'
          ) : (
            <>
              Next attempt in <strong className="text-[#B57614]">{countdown}s</strong>
            </>
          )}
        </span>
        <span className="text-[#E2E0D8]">·</span>
        <span className="flex items-center gap-1">
          <RotateCw className={`w-3 h-3 ${isRetrying ? 'animate-spin text-[#B57614]' : ''}`} />
          Backend API not responding
        </span>
      </div>

      {/* Right Action Button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => void retry()}
          disabled={isRetrying}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#8A3E00] hover:bg-[#703200] active:scale-95 text-white font-mono font-bold text-[10.5px] sm:text-[11px] rounded transition-all cursor-pointer shadow-2xs whitespace-nowrap"
        >
          <span>{isRetrying ? 'Retrying...' : 'Force Retry'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
