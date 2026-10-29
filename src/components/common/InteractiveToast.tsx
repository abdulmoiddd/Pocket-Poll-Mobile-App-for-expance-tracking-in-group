import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastOptions, ToastType } from '../../types/toast';
import { theme } from '../../theme';
import {
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  X,
  ChevronRight,
} from 'lucide-react-native';

interface InteractiveToastProps {
  toast: ToastOptions | null;
  onDismiss: () => void;
}

export const InteractiveToast: React.FC<InteractiveToastProps> = ({ toast, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toast) {
      // Reset animation values
      translateY.setValue(-120);
      opacity.setValue(0);
      progress.setValue(1);

      // Slide in animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = toast.duration ?? 4500;

      // Animate progress bar
      Animated.timing(progress, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }).start();

      // Auto dismiss timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [toast]);

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handleAction = () => {
    if (toast?.onAction) {
      toast.onAction();
    }
    handleDismiss();
  };

  if (!toast) return null;

  const getStyleForType = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          accentColor: '#10B981',
          bgAccent: '#ECFDF5',
          borderColor: '#A7F3D0',
          Icon: CheckCircle,
          iconColor: '#059669',
        };
      case 'warning':
        return {
          accentColor: '#F59E0B',
          bgAccent: '#FFFBEB',
          borderColor: '#FDE68A',
          Icon: AlertTriangle,
          iconColor: '#D97706',
        };
      case 'danger':
        return {
          accentColor: '#EF4444',
          bgAccent: '#FEF2F2',
          borderColor: '#FECACA',
          Icon: AlertOctagon,
          iconColor: '#DC2626',
        };
      case 'info':
      default:
        return {
          accentColor: theme.colors.primary,
          bgAccent: '#EDE9FE',
          borderColor: '#DDD6FE',
          Icon: Info,
          iconColor: theme.colors.primary,
        };
    }
  };

  const currentStyle = getStyleForType(toast.type);
  const IconComponent = currentStyle.Icon;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: Math.max(insets.top + 6, Platform.OS === 'android' ? 24 : 12),
          transform: [{ translateY }],
          opacity,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View
        style={[
          styles.toastCard,
          { borderColor: currentStyle.borderColor, borderLeftColor: currentStyle.accentColor },
        ]}
      >
        <TouchableOpacity
          activeOpacity={toast.onAction ? 0.8 : 1}
          onPress={toast.onAction ? handleAction : undefined}
          style={styles.contentRow}
        >
          {/* Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: currentStyle.bgAccent }]}>
            <IconComponent size={20} color={currentStyle.iconColor} />
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {toast.title}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>

          {/* Interactive Action Button (if provided) */}
          {toast.actionText && (
            <TouchableOpacity
              onPress={handleAction}
              style={[styles.actionBtn, { backgroundColor: currentStyle.bgAccent }]}
              accessibilityRole="button"
              accessibilityLabel={toast.actionText}
            >
              <Text style={[styles.actionBtnText, { color: currentStyle.iconColor }]}>
                {toast.actionText}
              </Text>
              <ChevronRight size={13} color={currentStyle.iconColor} />
            </TouchableOpacity>
          )}

          {/* Dismiss Button */}
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Dismiss alert"
          >
            <X size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Progress Bar Indicator */}
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: currentStyle.accentColor,
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    elevation: 99999,
  },
  toastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 5,
    overflow: 'hidden',
    ...theme.shadows.lg,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  progressBar: {
    height: 3,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});
