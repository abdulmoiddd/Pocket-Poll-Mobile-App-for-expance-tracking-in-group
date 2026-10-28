import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'elevated' | 'flat' | 'outline';
  borderRadius?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  borderRadius = theme.borderRadius.lg, // 24px default
}) => {
  return (
    <View
      style={[
        styles.base,
        { borderRadius },
        variant === 'elevated' && styles.elevated,
        variant === 'outline' && styles.outline,
        variant === 'flat' && styles.flat,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
  },
  elevated: {
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  flat: {
    backgroundColor: theme.colors.background,
  },
});
