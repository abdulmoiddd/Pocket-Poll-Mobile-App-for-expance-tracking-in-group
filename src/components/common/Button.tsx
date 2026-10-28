import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const isPrimary = variant === 'primary';

  const containerPadding =
    size === 'sm'
      ? { paddingVertical: 10, paddingHorizontal: 16 }
      : size === 'lg'
      ? { paddingVertical: 18, paddingHorizontal: 28 }
      : { paddingVertical: 14, paddingHorizontal: 22 };

  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 17 : 15;

  if (isPrimary && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading || disabled}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityState={{ disabled: loading || disabled }}
        style={[styles.gradientWrapper, style]}
      >
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientButton, containerPadding]}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.textWhite} size="small" />
          ) : (
            <View style={styles.contentRow}>
              {icon && <View style={styles.iconMargin}>{icon}</View>}
              <Text style={[styles.primaryText, { fontSize }, textStyle]}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'danger':
        return styles.dangerButton;
      case 'outline':
        return styles.outlineButton;
      case 'ghost':
        return styles.ghostButton;
      default:
        return styles.secondaryButton;
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
        return styles.dangerText;
      case 'outline':
        return styles.outlineText;
      case 'ghost':
        return styles.ghostText;
      default:
        return styles.secondaryText;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: loading || disabled }}
      style={[
        styles.baseButton,
        containerPadding,
        getVariantStyle(),
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconMargin}>{icon}</View>}
          <Text
            style={[
              styles.baseText,
              getVariantTextStyle(),
              { fontSize },
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gradientWrapper: {
    borderRadius: theme.borderRadius.full, // 32px per requirements
    overflow: 'hidden',
    ...theme.shadows.button,
  },
  gradientButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
  },
  baseButton: {
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: 8,
  },
  baseText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  primaryText: {
    color: theme.colors.textWhite,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: theme.colors.primaryLight,
  },
  secondaryText: {
    color: theme.colors.primary,
  },
  dangerButton: {
    backgroundColor: theme.colors.dangerLight,
  },
  dangerText: {
    color: theme.colors.danger,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  outlineText: {
    color: theme.colors.textPrimary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: theme.colors.primary,
  },
  disabledButton: {
    backgroundColor: '#E2E8F0',
    borderColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: '#94A3B8',
  },
});
