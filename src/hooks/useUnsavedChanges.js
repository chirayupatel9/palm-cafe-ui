import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook to track unsaved changes and warn users before navigation
 * 
 * @param {boolean} hasUnsavedChanges - Whether there are unsaved changes
 * @param {string} message - Custom warning message
 */
export const useUnsavedChanges = (hasUnsavedChanges, message = 'You have unsaved changes. Are you sure you want to leave?') => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  // Update ref when hasUnsavedChanges changes
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [message]);

  // Handle programmatic navigation
  const handleNavigation = (path, options = {}) => {
    if (hasUnsavedChangesRef.current) {
      if (window.confirm(message)) {
        navigate(path, options);
      }
    } else {
      navigate(path, options);
    }
  };

  return { handleNavigation };
};

/**
 * Hook to track form changes and determine if there are unsaved changes
 * 
 * @param {object} initialData - Initial form data
 * @param {object} currentData - Current form data
 * @returns {boolean} - Whether there are unsaved changes
 */
export const useFormChanges = (initialData, currentData) => {
  const hasChanges = JSON.stringify(initialData) !== JSON.stringify(currentData);
  return hasChanges;
};
