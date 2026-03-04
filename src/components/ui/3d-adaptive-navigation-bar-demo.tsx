/**
 * Demo for 3D Adaptive Navigation Pill.
 * Import and render this component to preview the pill in isolation.
 * In the app it is used in App.tsx as the main admin nav (desktop).
 */
import React from 'react';
import { PillBase } from './3d-adaptive-navigation-bar';

export default function Demo3dAdaptiveNav() {
  return (
    <div
      style={{
        background: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <PillBase />
    </div>
  );
}
