import React from 'react';
import { GlassButton } from './GlassButton';
import { Zap } from 'lucide-react';

const DottedBackground = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="100%"
    width="100%"
    className="pointer-events-none absolute inset-0 z-0"
  >
    <defs>
      <pattern
        patternUnits="userSpaceOnUse"
        height="30"
        width="30"
        id="dottedGrid"
      >
        <circle
          fill="var(--color-on-surface-page, #0b0f05)"
          fillOpacity="0.3"
          r="1"
          cy="2"
          cx="2"
        />
      </pattern>
    </defs>
    <rect fill="url(#dottedGrid)" height="100%" width="100%" />
  </svg>
);

const GlassButtonDemo = () => {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center gap-8 bg-background p-10">
      <DottedBackground />
      <div className="z-10 text-center">
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
          <GlassButton size="sm" className="glass-button-primary">
            Small
          </GlassButton>
          <GlassButton
            size="default"
            className="glass-button-primary"
            contentClassName="flex items-center gap-2"
          >
            <span>Generate</span>
            <Zap className="h-5 w-5" />
          </GlassButton>
          <GlassButton size="lg" className="glass-button-primary">
            Submit
          </GlassButton>
          <GlassButton size="icon" className="glass-button-primary">
            <Zap className="h-5 w-5" />
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export default GlassButtonDemo;
