import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ToastBar, toast } from 'react-hot-toast';

const DISMISS_THRESHOLD = 60;

interface ToastType {
  id: string;
  [key: string]: unknown;
}

interface SwipeableToastProps {
  toast: ToastType;
  position?: string;
}

function SwipeableToast({ toast: t, position }: SwipeableToastProps): React.ReactElement {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  offsetRef.current = offset;
  draggingRef.current = isDragging;

  const dismiss = useCallback(() => {
    toast.dismiss(t.id);
  }, [t.id]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startRef.current = { x: clientX, y: clientY };
    draggingRef.current = true;
    setIsDragging(true);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current) return;
    const dx = clientX - startRef.current.x;
    const dy = clientY - startRef.current.y;
    setOffset({ x: dx, y: dy });
  }, []);

  const handleEnd = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    const { x, y } = offsetRef.current;
    if (Math.abs(x) >= DISMISS_THRESHOLD || Math.abs(y) >= DISMISS_THRESHOLD) {
      dismiss();
    } else {
      setOffset({ x: 0, y: 0 });
    }
  }, [dismiss]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) handleStart(touch.clientX, touch.clientY);
    },
    [handleStart]
  );
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (draggingRef.current) e.preventDefault();
      const touch = e.touches[0];
      if (touch) handleMove(touch.clientX, touch.clientY);
    },
    [handleMove]
  );
  const onTouchEnd = useCallback(handleEnd, [handleEnd]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    },
    [handleStart]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div
      className="palm-toast-swipe-wrap"
      style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
    >
      <div
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: Math.max(0.3, 1 - (Math.abs(offset.x) + Math.abs(offset.y)) / 200)
        }}
      >
        <ToastBar toast={t as any} position={(position as 'top-center' | 'bottom-center') || 'bottom-center'} />
      </div>
    </div>
  );
}

export default SwipeableToast;
