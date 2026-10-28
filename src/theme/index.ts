export const theme = {
  colors: {
    // Primary Purple Gradient
    primaryStart: '#7B66FF',
    primaryEnd: '#5A48D6',
    primary: '#6C56F0',
    primaryLight: '#EDE9FE',
    primaryLighter: '#F5F3FF',

    // Content Backgrounds
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    // Typography
    textPrimary: '#1F2937',      // Dark charcoal for headings
    textSecondary: '#64748B',    // Slate for body
    textMuted: '#9CA3AF',        // Light gray for secondary text/captions
    textWhite: '#FFFFFF',        // Pure white for gradients/headers
    textInverse: '#FFFFFF',

    // Accent Category Colors
    food: '#F97316',             // Food (Orange)
    foodLight: '#FFEDD5',
    transport: '#2563EB',        // Transport (Deep Blue)
    transportLight: '#DBEAFE',
    shopping: '#10B981',         // Shopping (Bright Green)
    shoppingLight: '#D1FAE5',
    fun: '#EC4899',              // Fun (Pink)
    funLight: '#FCE7F3',
    bills: '#8B5CF6',            // Bills (Purple)
    billsLight: '#EDE9FE',
    other: '#6B7280',            // Other (Gray)
    otherLight: '#F3F4F6',

    // Status & Feedback Colors
    success: '#10B981',          // Mint Green positive indicator
    successLight: '#ECFDF5',
    danger: '#EF4444',           // Danger / alert
    dangerLight: '#FEF2F2',
    warning: '#F59E0B',          // Warning / threshold near
    warningLight: '#FFFBEB',
    info: '#3B82F6',
  },

  gradients: {
    primary: ['#7B66FF', '#5A48D6'] as const,
    card: ['#8B7CF8', '#5A48D6'] as const,
    accent: ['#EC4899', '#8B5CF6'] as const,
    success: ['#10B981', '#059669'] as const,
    warning: ['#F59E0B', '#D97706'] as const,
    dark: ['#1E293B', '#0F172A'] as const,
  },

  borderRadius: {
    sm: 12,
    md: 16,
    lg: 24,                      // 24px per requirements
    xl: 28,                      // 28px
    full: 32,                    // 32px per requirements
    round: 9999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#5A48D6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#5A48D6',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
      elevation: 8,
    },
    button: {
      shadowColor: '#5A48D6',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 6,
    },
  },

  typography: {
    hero: { fontSize: 36, fontWeight: '700' as const, letterSpacing: -0.5 },
    h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
    h2: { fontSize: 22, fontWeight: '600' as const },
    h3: { fontSize: 18, fontWeight: '600' as const },
    body: { fontSize: 15, fontWeight: '400' as const },
    bodyMedium: { fontSize: 15, fontWeight: '500' as const },
    bodySemibold: { fontSize: 15, fontWeight: '600' as const },
    caption: { fontSize: 13, fontWeight: '400' as const },
    captionSemibold: { fontSize: 13, fontWeight: '600' as const },
    small: { fontSize: 11, fontWeight: '500' as const },
  },
};

export type Theme = typeof theme;
