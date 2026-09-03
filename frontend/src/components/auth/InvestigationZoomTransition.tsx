import React, { useEffect, useState, useMemo } from 'react';

interface InvestigationZoomTransitionProps {
  startRect?: DOMRect | null;
  onComplete: () => void;
}

export const InvestigationZoomTransition: React.FC<InvestigationZoomTransitionProps> = ({
  startRect,
  onComplete,
}) => {
  const [stage, setStage] = useState<'resting' | 'zooming' | 'crossfading' | 'done'>('resting');

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 768;

  const totalDuration = prefersReducedMotion ? 250 : isMobile ? 1100 : 1350;

  // Calculate pixel-perfect screen center alignment
  const geometry = useMemo(() => {
    if (typeof window === 'undefined') {
      return { left: 160, top: 380, width: 420, height: 420, deltaX: 280, deltaY: -70 };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const width = startRect ? startRect.width : Math.min(420, vw * 0.45);
    const height = startRect ? startRect.height : width;
    const left = startRect ? startRect.left : vw * 0.12;
    const top = startRect ? startRect.top : vh * 0.46;

    // Optical lens center in the 1024x1024 asset is at (64.26%, 32.71%)
    const currentLensCenterX = left + width * 0.6426;
    const currentLensCenterY = top + height * 0.3271;

    const targetCenterX = vw / 2;
    const targetCenterY = vh / 2;

    const deltaX = targetCenterX - currentLensCenterX;
    const deltaY = targetCenterY - currentLensCenterY;

    return { left, top, width, height, deltaX, deltaY };
  }, [startRect]);

  useEffect(() => {
    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        onComplete();
      }, 250);
      return () => clearTimeout(timer);
    }

    // Step 1: Start uninterrupted glide and scale at t=35ms
    const zoomTimer = setTimeout(() => {
      setStage('zooming');
    }, 35);

    // Step 2: Fade overlay backdrop during final expansion (lens fills viewport)
    const crossfadeTime = isMobile ? 850 : 1050;
    const crossfadeTimer = setTimeout(() => {
      setStage('crossfading');
    }, crossfadeTime);

    // Step 3: Complete transition, unmount overlay, restore interaction at 1.35s
    const completeTimer = setTimeout(() => {
      setStage('done');
      onComplete();
    }, totalDuration);

    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(crossfadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, prefersReducedMotion, isMobile, totalDuration]);

  if (stage === 'done') {
    return null;
  }

  // Reduced motion fallback: graceful 250ms direct crossfade
  if (prefersReducedMotion) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 z-50 pointer-events-none bg-[#EFEAE2] transition-opacity duration-200"
        style={{ opacity: stage === 'resting' ? 1 : 0 }}
      />
    );
  }

  const isZooming = stage === 'zooming' || stage === 'crossfading';
  const isCrossfading = stage === 'crossfading';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden select-none"
      style={{
        opacity: isCrossfading ? 0 : 1,
        transition: `opacity ${isMobile ? '250ms' : '300ms'} cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      {/* Background Soft Wash */}
      <div
        className="absolute inset-0 bg-[#EFEAE2]/90 backdrop-blur-xs"
        style={{
          opacity: isCrossfading ? 0 : 1,
          transition: `opacity ${isMobile ? '250ms' : '300ms'} ease-out`,
        }}
      />

      {/* Subtle Full-Page Depth Vignette */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(221, 161, 94, 0.22) 0%, rgba(138, 90, 54, 0.16) 50%, rgba(32, 21, 15, 0.38) 100%)',
          opacity: isZooming ? 0.9 : 0.2,
        }}
      />

      {/* Single Persistent Magnifying-Glass Assembly with Uninterrupted Transform */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          left: `${geometry.left}px`,
          top: `${geometry.top}px`,
          width: `${geometry.width}px`,
          height: `${geometry.height}px`,
          transformOrigin: '64.26% 32.71%', // Mathematically exact optical lens center
          transform: isZooming
            ? `translate3d(${geometry.deltaX}px, ${geometry.deltaY}px, 0) scale3d(26, 26, 1) rotate(1.2deg)`
            : 'translate3d(0, 0, 0) scale3d(1, 1, 1) rotate(0deg)',
          transition: prefersReducedMotion
            ? 'none'
            : `transform ${isMobile ? '1050ms' : '1350ms'} cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: isZooming ? 'transform' : 'auto',
        }}
      >
        {/* Soft Ambient Copper Glow behind Bezel */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 64.26% 32.71%, rgba(221, 161, 94, 0.45) 0%, rgba(184, 125, 75, 0.22) 35%, transparent 65%)',
            filter: 'blur(16px)',
            opacity: isZooming ? 0.95 : 0.4,
            transition: 'opacity 0.6s ease-in',
          }}
        />

        {/* Circular Optical Lens Portal: Live Subtle Copper Intelligence-Network Constellation */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{
            clipPath: 'circle(20.5% at 64.26% 32.71%)',
            WebkitClipPath: 'circle(20.5% at 64.26% 32.71%)',
          }}
        >
          {/* Internal Lens Light & Bokeh */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 64.26% 32.71%, rgba(255, 250, 240, 0.35) 0%, rgba(221, 161, 94, 0.25) 30%, rgba(138, 90, 54, 0.15) 60%, transparent 100%)',
            }}
          />

          {/* SVG Animated Intelligence Network Nodes & Fine Lines inside Lens */}
          <svg
            viewBox="0 0 1024 1024"
            className="w-full h-full"
            style={{
              opacity: isZooming ? 1 : 0.5,
              transition: 'opacity 0.4s ease-in 0.15s',
            }}
          >
            {/* Fine Interconnecting Network Lines */}
            <line x1="620" y1="310" x2="658" y2="335" stroke="#DDA15E" strokeWidth="2.5" opacity="0.8" />
            <line x1="658" y1="335" x2="700" y2="315" stroke="#DDA15E" strokeWidth="2.5" opacity="0.8" />
            <line x1="658" y1="335" x2="675" y2="375" stroke="#C48D5E" strokeWidth="2" opacity="0.75" />
            <line x1="620" y1="310" x2="610" y2="355" stroke="#C48D5E" strokeWidth="1.8" strokeDasharray="5 5" opacity="0.65" />
            <line x1="610" y1="355" x2="675" y2="375" stroke="#B8865B" strokeWidth="1.8" opacity="0.6" />
            <line x1="700" y1="315" x2="710" y2="360" stroke="#DDA15E" strokeWidth="1.8" strokeDasharray="5 5" opacity="0.65" />

            {/* Pulsing Concentric Radar / Scan Rings */}
            <circle cx="658" cy="335" r="95" fill="none" stroke="#DDA15E" strokeWidth="1.5" strokeDasharray="16 14" opacity="0.5" />
            <circle cx="658" cy="335" r="55" fill="none" stroke="#DDA15E" strokeWidth="1.2" strokeDasharray="8 8" opacity="0.4" />

            {/* Glowing Golden Network Nodes */}
            <circle cx="658" cy="335" r="9" fill="#DDA15E" />
            <circle cx="658" cy="335" r="16" fill="none" stroke="#DDA15E" strokeWidth="2" opacity="0.6" />

            <circle cx="620" cy="310" r="6.5" fill="#E2A676" />
            <circle cx="700" cy="315" r="7" fill="#E2A676" />
            <circle cx="675" cy="375" r="6.5" fill="#C48D5E" />
            <circle cx="610" cy="355" r="5.5" fill="#B8865B" />
            <circle cx="710" cy="360" r="5.5" fill="#B8865B" />
          </svg>
        </div>

        {/* The Single High-Resolution Copper Magnifying-Glass PNG Asset */}
        <img
          src="/netra_copper_magnifying_glass.png"
          alt="Forensic Magnifier"
          className="w-full h-full object-contain filter drop-shadow-[0_25px_50px_rgba(45,28,15,0.45)]"
        />
      </div>
    </div>
  );
};

export default InvestigationZoomTransition;
