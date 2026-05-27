// Design tokens — all colors, spacing, typography, and radius values in one place.
// Import from here, never hardcode hex values in components.

export const colors = {
  // Primary brand — amber
  primary: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
  },

  // Sidebar background
  stone: {
    50: "#FAFAF9",
    100: "#F5F4F2",
    200: "#E7E5E4",
    300: "#D6D3D1",
    400: "#A8A29E",
    500: "#78716C",
    600: "#57534E",
    700: "#44403C",
    800: "#292524",
    900: "#1C1917",
  },

  white: "#FFFFFF",
  black: "#000000",

  // Semantic
  success: { 100: "#DCFCE7", 600: "#16A34A", 700: "#15803D" },
  warning: { 100: "#FEF3C7", 600: "#D97706", 700: "#B45309" },
  error: { 100: "#FEE2E2", 600: "#DC2626", 700: "#B91C1C" },
  info: { 100: "#DBEAFE", 600: "#2563EB", 700: "#1D4ED8" },
} as const;

// Maps each order status to a consistent badge color set.
export const orderStatusColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  pending: { bg: colors.warning[100], text: colors.warning[700], border: colors.warning[600] },
  accepted: { bg: colors.info[100], text: colors.info[700], border: colors.info[600] },
  preparing: { bg: "#EDE9FE", text: "#6D28D9", border: "#7C3AED" },
  ready: { bg: colors.success[100], text: colors.success[700], border: colors.success[600] },
  completed: { bg: colors.stone[100], text: colors.stone[600], border: colors.stone[400] },
  cancelled: { bg: colors.error[100], text: colors.error[700], border: colors.error[600] },
  rejected: { bg: colors.error[100], text: colors.error[700], border: colors.error[600] },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
} as const;

export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const shadow = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const SIDEBAR_WIDTH = 220;
