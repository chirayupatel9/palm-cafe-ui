import React, { useState, useRef, useEffect } from 'react';
import { motion, useSpring, AnimatePresence } from 'framer-motion';

export interface NavItem {
  label: string;
  id: string;
}

export interface PillBaseProps {
  /** Navigation items. Defaults to Home / Problem / Solution / Contact if not provided. */
  items?: NavItem[];
  /** Controlled active section id. If not provided, component uses internal state. */
  activeId?: string;
  /** Called when user selects a section. Use for routing or page change (e.g. setCurrentPage). */
  onSelect?: (id: string) => void;
  /** When true, bar is always full width with all items visible (no hover collapse). */
  alwaysExpanded?: boolean;
}

const defaultNavItems: NavItem[] = [
  { label: 'Home', id: 'home' },
  { label: 'Problem', id: 'problem' },
  { label: 'Solution', id: 'solution' },
  { label: 'Contact', id: 'contact' }
];

/**
 * 3D Adaptive Navigation Pill
 * Smart navigation with hover expansion and optional controlled active state.
 */
export const PillBase: React.FC<PillBaseProps> = ({
  items = defaultNavItems,
  activeId,
  onSelect,
  alwaysExpanded = false
}) => {
  const [internalActive, setInternalActive] = useState(items[0]?.id ?? 'home');
  const activeSection = activeId ?? internalActive;
  const setActiveSection = (id: string) => {
    if (activeId === undefined) setInternalActive(id);
    onSelect?.(id);
  };

  const [expanded, setExpanded] = useState(alwaysExpanded);
  const [hovering, setHovering] = useState(false);
  const isExpanded = alwaysExpanded || expanded;
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSectionRef = useRef(activeSection);

  const navItems: NavItem[] = items.length > 0 ? items : defaultNavItems;

  const pillShift = useSpring(0, { stiffness: 220, damping: 25, mass: 1 });

  useEffect(() => {
    if (alwaysExpanded) return;
    if (hovering) {
      setExpanded(true);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setExpanded(false);
      }, 600);
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [hovering, alwaysExpanded]);

  const handleMouseEnter = () => {
    setHovering(true);
  };

  const handleMouseLeave = () => {
    setHovering(false);
  };

  const handleSectionClick = (sectionId: string) => {
    setIsTransitioning(true);
    prevSectionRef.current = sectionId;
    setActiveSection(sectionId);
    setHovering(false);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  };

  const activeItem = navItems.find((item) => item.id === activeSection);

  return (
    <motion.nav
      onMouseEnter={alwaysExpanded ? undefined : handleMouseEnter}
      onMouseLeave={alwaysExpanded ? undefined : handleMouseLeave}
      className="relative rounded-full flex-shrink-0"
      initial={false}
      animate={{
        width: isExpanded ? '100%' : 140
      }}
      transition={{ type: 'spring', stiffness: 220, damping: 25 }}
      style={{
        height: '56px',
        minWidth: isExpanded ? undefined : 140,
        background: 'transparent',
        boxShadow: 'none',
        x: pillShift,
        overflow: 'hidden'
      }}
    >
      <div
        ref={containerRef}
        className="relative z-10 h-full flex items-center justify-center px-6 sm:px-8"
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro", Poppins, sans-serif'
        }}
      >
        {!isExpanded && (
          <div className="flex items-center relative">
            <AnimatePresence mode="wait">
              {activeItem && (
                <motion.span
                  key={activeItem.id}
                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                  transition={{
                    duration: 0.35,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                  style={{
                    fontSize: '15.5px',
                    fontWeight: 680,
                    color: 'var(--color-on-surface)',
                    letterSpacing: '0.45px',
                    whiteSpace: 'nowrap',
                    fontFamily:
                      'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", Poppins, sans-serif',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale'
                  }}
                >
                  {activeItem.label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}

        {isExpanded && (
          <div className="flex items-center justify-evenly w-full flex-nowrap gap-x-0 sm:gap-x-1">
            {navItems.map((item, index) => {
              const isActive = item.id === activeSection;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.22,
                    ease: 'easeOut'
                  }}
                  className="relative flex items-center justify-center"
                >
                  {isActive && (
                    <motion.span
                      layoutId="pill-active-glass"
                      className="absolute inset-0 rounded-full pointer-events-none"
                      animate={{
                        y: [0, -0.5, 0],
                        scale: [1, 1.008, 1]
                      }}
                      transition={{
                        y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                        scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                      }}
                      style={{
                        background: 'var(--color-primary-container)',
                        boxShadow: 'var(--elevation-1), inset 0 0 0 1px var(--color-outline-variant)',
                        border: 'none',
                        opacity: 0.95,
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)'
                      }}
                    >
                      {/* Bubble highlight on active pill */}
                      <span
                        className="absolute inset-x-0 top-0 rounded-t-full pointer-events-none"
                        style={{
                          height: '55%',
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 100%)',
                          borderRadius: '9999px 9999px 0 0'
                        }}
                      />
                      <span
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                          boxShadow: 'inset 0 0 20px rgba(255,255,255,0.15), inset 0 -4px 12px rgba(0,0,0,0.06)'
                        }}
                      />
                    </motion.span>
                  )}
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.22,
                      ease: 'easeOut'
                    }}
                    onClick={() => handleSectionClick(item.id)}
                    className="relative z-10 cursor-pointer transition-colors duration-200 rounded-full py-2.5 px-4 pill-nav-btn"
                    style={{
                      fontSize: isActive ? '15.5px' : '15px',
                      fontWeight: isActive ? 680 : 510,
                      color: isActive ? 'var(--color-on-primary-container)' : 'var(--color-on-surface-variant)',
                      textDecoration: 'none',
                      letterSpacing: '0.45px',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                      whiteSpace: 'nowrap',
                      fontFamily:
                        'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", Poppins, sans-serif',
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--color-on-surface)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--color-on-surface-variant)';
                      }
                    }}
                  >
                    {item.label}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.nav>
  );
};
