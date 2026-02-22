// Utility functions for the project
// https://ui.shadcn.com/docs/installation/next

export function cn(...inputs: any[]): string {
  return inputs.filter(Boolean).join(' ');
}
