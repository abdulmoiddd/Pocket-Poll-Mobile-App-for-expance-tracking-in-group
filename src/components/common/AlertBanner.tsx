import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, X, ChevronRight } from 'lucide-react-native';
import { theme } from '../../theme';

interface AlertBannerProps {
  message: string;
  onDismiss?: () => void;
  onPress?: () => void;
  type?: 'warning' | 'danger';
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  message,
  onDismiss,
  onPress,
  type = 'warning',
}) => {
  const isDanger = type === 'danger';
  const bgColor = isDanger ? '#FEF2F2' : '#FFFBEB';
  const borderColor = isDanger ? '#FCA5A5' : '#FDE68A';
  const textColor = isDanger ? '#991B1B' : '#92400E';
  const iconColor = isDanger ? '#DC2626' : '#D97706';

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[styles.banner, { backgroundColor: bgColor, borderColor }]}
      accessibilityRole="alert"
      accessibilityLabel={`Budget Alert: ${message}`}
    >
      <View style={styles.iconContainer}>
        <AlertTriangle size={20} color={iconColor} />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: textColor }]}>
          {isDanger ? 'Critical Budget Warning' : 'Low Budget Threshold Alert'}
        </Text>
        <Text style={[styles.message, { color: textColor }]}>{message}</Text>
      </View>

      {onDismiss ? (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.actionButton}
          accessibilityLabel="Dismiss alert"
          accessibilityRole="button"
        >
          <X size={18} color={textColor} />
        </TouchableOpacity>
      ) : onPress ? (
        <ChevronRight size={18} color={textColor} />
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    marginHorizontal: 20,
    marginVertical: 10,
    ...theme.shadows.sm,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
});
