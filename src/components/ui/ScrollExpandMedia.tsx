import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc?: string;
  posterSrc?: string;
  bgImageSrc?: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: React.ReactNode;
}

const ScrollExpandMedia: React.FC<ScrollExpandMediaProps> = ({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  children
}) => {
  const [showContent, setShowContent] = useState(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobileState, setIsMobileState] = useState(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const targetProgressRef = useRef(0);
  const displayProgressRef = useRef(0);
  const expandedRef = useRef(false);

  expandedRef.current = mediaFullyExpanded;

  useEffect(() => {
    setShowContent(false);
    setMediaFullyExpanded(false);
    targetProgressRef.current = 0;
    displayProgressRef.current = 0;
    if (sectionRef.current) {
      sectionRef.current.style.setProperty('--hero-progress', '0');
    }
  }, [mediaType]);

  useEffect(() => {
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const id = requestAnimationFrame(() => { window.scrollTo(0, 0); });
    return () => {
      cancelAnimationFrame(id);
      window.history.scrollRestoration = prev;
    };
  }, []);

  useEffect(() => {
    let rafId: number | null = null;
    const LERP = 0.18;

    function tick() {
      const target = targetProgressRef.current;
      let display = displayProgressRef.current;
      display += (target - display) * LERP;
      if (Math.abs(display - target) < 0.001) display = target;
      displayProgressRef.current = display;

      const el = sectionRef.current;
      if (el) el.style.setProperty('--hero-progress', String(display));

      if (display >= 1 && !expandedRef.current) {
        expandedRef.current = true;
        setMediaFullyExpanded(true);
        setShowContent(true);
      } else if (display < 0.75) {
        setShowContent(false);
      }

      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    const handleWheel = (e: WheelEvent) => {
      if (expandedRef.current && e.deltaY < 0 && window.scrollY <= 5) {
        expandedRef.current = false;
        targetProgressRef.current = 0;
        setMediaFullyExpanded(false);
        setShowContent(false);
        e.preventDefault();
        return;
      }
      if (expandedRef.current) return;
      e.preventDefault();
      const scrollDelta = e.deltaY * 0.0009;
      const newProgress = Math.min(Math.max(targetProgressRef.current + scrollDelta, 0), 1);
      targetProgressRef.current = newProgress;
    };

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      if (expandedRef.current && deltaY < -20 && window.scrollY <= 5) {
        expandedRef.current = false;
        targetProgressRef.current = 0;
        setMediaFullyExpanded(false);
        setShowContent(false);
        e.preventDefault();
        return;
      }
      if (expandedRef.current) return;
      e.preventDefault();
      const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
      const newProgress = Math.min(Math.max(targetProgressRef.current + deltaY * scrollFactor, 0), 1);
      targetProgressRef.current = newProgress;
      setTouchStartY(touchY);
    };

    const handleTouchEnd = () => {
      setTouchStartY(0);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStartY]);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const cardW = isMobileState ? 1150 : 1900;
  const cardH = isMobileState ? 720 : 1000;
  const textVw = isMobileState ? 180 : 150;

  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    <div
      ref={sectionRef}
      className="overflow-x-hidden"
      style={{ ['--hero-progress' as string]: 0 }}
    >
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh]">
        <div className="relative w-full flex flex-col items-center min-h-[100dvh]">
          <div
            className="absolute inset-0 z-0 h-full bg-[#0b0f05]"
            style={{ opacity: 'calc(1 - var(--hero-progress, 0))' }}
          >
            {bgImageSrc && (
              <>
                <img
                  src={bgImageSrc}
                  alt=""
                  fetchPriority="high"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/10" />
              </>
            )}
          </div>

          <div className="container mx-auto flex flex-col items-center justify-start relative z-10">
            <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative">
              <div
                className="absolute z-0 top-1/2 left-1/2 origin-center rounded-2xl"
                style={{
                  width: cardW,
                  height: cardH,
                  maxWidth: '95vw',
                  maxHeight: '85vh',
                  boxShadow: '0px 0px 50px rgba(0, 0, 0, 0.3)',
                  transform: 'translate(-50%, -50%) scale(calc(0.24 + 0.76 * var(--hero-progress, 0)))',
                  willChange: 'transform'
                }}
              >
                {mediaType === 'video' ? (
                  mediaSrc && mediaSrc.includes('youtube.com') ? (
                    <div className="relative w-full h-full pointer-events-none">
                      <iframe
                        title="YouTube video embed"
                        width="100%"
                        height="100%"
                        src={
                          mediaSrc.includes('embed')
                            ? mediaSrc +
                              (mediaSrc.includes('?') ? '&' : '?') +
                              'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                            : mediaSrc.replace('watch?v=', 'embed/') +
                              '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' +
                              mediaSrc.split('v=')[1]
                        }
                        className="w-full h-full rounded-xl"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div
                        className="absolute inset-0 z-10"
                        style={{ pointerEvents: 'none' }}
                      />

                      <div
                        className="absolute inset-0 bg-black/30 rounded-xl"
                        style={{ opacity: 'calc(0.5 - var(--hero-progress, 0) * 0.3)' }}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-full pointer-events-none">
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover rounded-xl"
                        controls={false}
                      />
                      <div
                        className="absolute inset-0 z-10"
                        style={{ pointerEvents: 'none' }}
                      />

                      <div
                        className="absolute inset-0 bg-black/30 rounded-xl"
                        style={{ opacity: 'calc(0.5 - var(--hero-progress, 0) * 0.3)' }}
                      />
                    </div>
                  )
                ) : (
                  <div className="relative w-full h-full bg-[#0b0f05] rounded-xl overflow-hidden">
                    {mediaSrc && (
                      <>
                        <img
                          src={mediaSrc}
                          alt={title || 'Media content'}
                          fetchPriority="high"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover rounded-xl"
                        />
                        <div
                          className="absolute inset-0 bg-black/50 rounded-xl"
                          style={{ opacity: 'calc(0.7 - var(--hero-progress, 0) * 0.3)' }}
                        />
                      </>
                    )}
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center z-20 px-8 pt-20 pb-14 sm:px-10 sm:pt-24 sm:pb-16 md:px-12 md:pt-28 md:pb-20 lg:px-14 lg:pt-32 lg:pb-24">
                  <div
                    className="absolute inset-0 rounded-xl bg-gradient-to-b from-black/50 via-black/40 to-black/50"
                    aria-hidden
                  />
                  <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-full px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-6 md:px-10 md:pt-8 md:pb-6">
                    <h2
                      className="font-bold text-white"
                      style={{
                        fontFamily: "'Fuggles', cursive",
                        fontSize: 'clamp(6rem, 42vw, 26rem)',
                        lineHeight: 1,
                        transform: `translateX(calc(-1 * var(--hero-progress, 0) * ${textVw}vw))`
                      }}
                    >
                      {firstWord}
                    </h2>
                    <h2
                      className="font-bold text-center text-white"
                      style={{
                        fontFamily: "'Fuggles', cursive",
                        fontSize: 'clamp(6rem, 42vw, 26rem)',
                        lineHeight: 1,
                        transform: `translateX(calc(var(--hero-progress, 0) * ${textVw}vw))`
                      }}
                    >
                      {restOfTitle}
                    </h2>
                  </div>
                  <div className="relative z-10 flex flex-col items-center text-center mt-5 gap-2 px-6 pt-2 pb-6 sm:px-8 sm:pt-3 sm:pb-8">
                    {date && (
                      <p
                        className="text-2xl sm:text-3xl font-normal text-center"
                        style={{
                          color: '#ffffff',
                          transform: `translateX(calc(-1 * var(--hero-progress, 0) * ${textVw}vw))`,
                          textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 0 16px rgba(0,0,0,0.4)'
                        }}
                      >
                        {date}
                      </p>
                    )}
                    {scrollToExpand && (
                      <p
                        className="text-2xl sm:text-3xl font-normal text-center"
                        style={{
                          color: '#ffffff',
                          transform: `translateX(calc(var(--hero-progress, 0) * ${textVw}vw))`,
                          textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 0 16px rgba(0,0,0,0.4)'
                        }}
                      >
                        {scrollToExpand}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <motion.div
                className="relative z-20 mt-10 w-full max-w-4xl mx-auto px-6"
                initial={{ opacity: 0, translateY: 40 }}
                animate={{ opacity: showContent ? 1 : 0, translateY: showContent ? 0 : 40 }}
                transition={{ duration: 0.7 }}
              >
                {children}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;
