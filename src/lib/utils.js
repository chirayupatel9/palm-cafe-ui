/**
 * Merges class names, filtering out falsy values.
 * Used by shadcn-style UI components for conditional styling.
 * @param {...(string|undefined|null|boolean)} inputs - Class names to merge
 * @returns {string}
 */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
