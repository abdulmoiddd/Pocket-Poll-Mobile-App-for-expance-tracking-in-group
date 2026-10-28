import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { theme } from '../../theme';
import { formatCurrency } from '../../services/calculations';
import { AlertTriangle, Plus, Minus } from 'lucide-react-native';

interface ThresholdSliderProps {
  thresholdAmount: number;
  currencySymbol: string;
  onUpdateThreshold: (amount: number) => void;
}

const PRESETS = [100, 200, 300, 500, 1000];

export const ThresholdSlider: React.FC<ThresholdSliderProps> = ({
  thresholdAmount,
  currencySymbol,
  onUpdateThreshold,
}) => {
  const handleIncrement = (amount: number) => {
    const next = Math.max(10, thresholdAmount + amount);
    onUpdateThreshold(next);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AlertTriangle size={20} color={theme.colors.warning} />
          <Text style={styles.title}>Budget Alert Threshold</Text>
        </View>
        <Text style={styles.subtitle}>
          Trigger an in-app alert when remaining pool balance drops below this amount.
        </Text>
      </View>

      <View style={styles.controlRow}>
        <TouchableOpacity
          onPress={() => handleIncrement(-50)}
          style={styles.stepBtn}
          accessibilityRole="button"
          accessibilityLabel="Decrease threshold by 50"
        >
          <Minus size={18} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.amountDisplay}>
          <Text style={styles.amountText}>
            {formatCurrency(thresholdAmount, currencySymbol)}
          </Text>
          <Text style={styles.alertTriggerText}>Active Alert Trigger</Text>
        </View>

        <TouchableOpacity
          onPress={() => handleIncrement(50)}
          style={styles.stepBtn}
          accessibilityRole="button"
          accessibilityLabel="Increase threshold by 50"
        >
          <Plus size={18} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Quick Presets */}
      <View style={styles.presetsRow}>
        {PRESETS.map((p) => {
          const isSelected = thresholdAmount === p;
          return (
            <TouchableOpacity
              key={p}
              onPress={() => onUpdateThreshold(p)}
              style={[styles.presetPill, isSelected && styles.selectedPresetPill]}
              accessibilityRole="button"
              accessibilityLabel={`Set threshold to ${currencySymbol}${p}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.presetText,
                  isSelected && styles.selectedPresetText,
                ]}
              >
                {currencySymbol}
                {p}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    ...theme.shadows.sm,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  amountDisplay: {
    alignItems: 'center',
  },
  amountText: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  alertTriggerText: {
    fontSize: 11,
    color: theme.colors.warning,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 6,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F1F5F9',
  },
  selectedPresetPill: {
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  selectedPresetText: {
    color: theme.colors.primary,
  },
});
