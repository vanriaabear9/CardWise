/**
 * CardWise color palette (black & purple dark theme).
 * Always use these tokens instead of hard-coded hex values.
 */
export const colors = {
  // Backgrounds
  background: '#0D0B12', // main screen background
  surface: '#17131F', // secondary background (tab bar, inputs)
  card: '#211A2B', // cards and list items

  // Purple accents
  primary: '#8B5CF6', // primary buttons, active tab, important actions
  secondary: '#A78BFA', // lavender secondary highlights
  highlight: '#C4B5FD', // light lavender for subtle emphasis

  // Text
  textPrimary: '#FFFFFF', // headings and important text
  textSecondary: '#A9A3B5', // descriptions and secondary labels

  // Lines
  border: '#342B40', // borders and dividers

  // Translucent purple for icon badges / chips (no glow, just a soft fill)
  primaryMuted: 'rgba(139, 92, 246, 0.16)',

  // Errors and destructive actions (validation messages, delete buttons)
  danger: '#F87171',
  dangerMuted: 'rgba(248, 113, 113, 0.14)',
} as const;

export type ColorName = keyof typeof colors;
