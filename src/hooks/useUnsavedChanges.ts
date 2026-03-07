import { useEffect, useRef } from 'react';
import { useNavigate, NavigateOptions } from 'react-router-dom';

/**
 * Hook to track unsaved changes and warn users before navigation
 */
export const useUnsavedChanges = (
  hasUnsavedChanges: boolean,
  message = 'You have unsaved changes. Are you sure you want to leave?'
): { handleNavigation: (path: string | number, options?: NavigateOptions) => void } => {
  const navigate = useNavigate();
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [message]);

  const handleNavigation = (path: string | number, options: NavigateOptions = {}) => {
    if (hasUnsavedChangesRef.current) {
      if (window.confirm(message)) {
        navigate(path as string, options);
      }
    } else {
      navigate(path as string, options);
    }
  };

  return { handleNavigation };
};

/**
 * Hook to track form changes and determine if there are unsaved changes
 */
export const useFormChanges = <T extends object>(initialData: T, currentData: T): boolean => {
  return JSON.stringify(initialData) !== JSON.stringify(currentData);
};
