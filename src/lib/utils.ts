/**
 * Merges class names, filtering out falsy values.
 * Used by shadcn-style UI components for conditional styling.
 */
export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return inputs.filter(Boolean).join(' ');
}
