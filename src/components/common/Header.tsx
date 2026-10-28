import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { Logo } from './Logo';
import { Bell, Lock } from 'lucide-react-native';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  variant?: 'purple' | 'white';
  rightAction?: React.ReactNode;
  unreadAlerts?: number;
  onAlertPress?: () => void;
  onLockPress?: () => void;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showLogo = true,
  variant = 'purple',
  rightAction,
  unreadAlerts = 0,
  onAlertPress,
  onLockPress,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, 16);

  if (variant === 'white') {
    return (
      <View
        style={[styles.whiteHeader, { paddingTop }]}
        accessibilityRole="header"
      >
        <View style={styles.topRow}>
          <View style={styles.brandingGroup}>
            {showLogo && <Logo size={36} style={styles.logoMargin} />}
            <View>
              {title && <Text style={styles.whiteHeaderTitle}>{title}</Text>}
              {subtitle && <Text style={styles.whiteHeaderSubtitle}>{subtitle}</Text>}
            </View>
          </View>

          <View style={styles.actionsRow}>
            {onLockPress && (
              <TouchableOpacity
                onPress={onLockPress}
                style={styles.whiteIconButton}
                accessibilityLabel="Lock app"
                accessibilityRole="button"
              >
                <Lock size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
            {onAlertPress && (
              <TouchableOpacity
                onPress={onAlertPress}
                style={styles.whiteIconButton}
                accessibilityLabel={`Alerts. ${unreadAlerts} unread.`}
                accessibilityRole="button"
              >
                <Bell size={20} color={theme.colors.textPrimary} />
                {unreadAlerts > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadAlerts > 9 ? '9+' : unreadAlerts}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            {rightAction}
          </View>
        </View>
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={theme.gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.purpleHeader, { paddingTop }]}
      accessibilityRole="header"
    >
      <View style={styles.topRow}>
        <View style={styles.brandingGroup}>
          {showLogo && <Logo size={38} style={styles.logoMargin} />}
          <View>
            <Text style={styles.brandName}>PocketPool</Text>
            {subtitle ? (
              <Text style={styles.purpleHeaderSubtitle}>{subtitle}</Text>
            ) : (
              <Text style={styles.purpleHeaderSubtitle}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionsRow}>
          {onLockPress && (
            <TouchableOpacity
              onPress={onLockPress}
              style={styles.purpleIconButton}
              accessibilityLabel="Lock app"
              accessibilityRole="button"
            >
              <Lock size={18} color={theme.colors.textWhite} />
            </TouchableOpacity>
          )}
          {onAlertPress && (
            <TouchableOpacity
              onPress={onAlertPress}
              style={styles.purpleIconButton}
              accessibilityLabel={`Notifications, ${unreadAlerts} unread`}
              accessibilityRole="button"
            >
              <Bell size={20} color={theme.colors.textWhite} />
              {unreadAlerts > 0 && (
                <View style={styles.purpleBadge}>
                  <Text style={styles.badgeText}>
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          {rightAction}
        </View>
      </View>
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  purpleHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  whiteHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoMargin: {
    marginRight: 10,
  },
  brandName: {
    color: theme.colors.textWhite,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  purpleHeaderSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  whiteHeaderTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  whiteHeaderSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  purpleIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  purpleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#7B66FF',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
