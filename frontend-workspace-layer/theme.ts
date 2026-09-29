/**
 * Shared design tokens for the IDE. Dark-first, VS Code-inspired palette.
 */
export const colors = {
  bg: '#1e1e1e',
  bgPanel: '#252526',
  bgSidebar: '#252526',
  bgActivity: '#333333',
  bgInput: '#3c3c3c',
  border: '#3c3c3c',
  text: '#cccccc',
  textMuted: '#858585',
  textBright: '#ffffff',
  accent: '#0e639c',
  accentHover: '#1177bb',
  diffAdd: 'rgba(35, 134, 54, 0.35)',
  diffDelete: 'rgba(248, 81, 73, 0.35)',
  ai: '#7c3aed',
  error: '#f85149',
  success: '#3fb950'
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
} as const;
