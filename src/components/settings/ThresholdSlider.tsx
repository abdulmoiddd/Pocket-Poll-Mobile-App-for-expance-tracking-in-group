import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { theme } from '../../theme';
import { AlertTriangle, Plus, Minus, Edit3 } from 'lucide-react-native';

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
  const [inputText, setInputText] = useState(thresholdAmount.toString());

  // Keep input text in sync when thresholdAmount updates via presets or +/- buttons
  useEffect(() => {
    setInputText(thresholdAmount.toString());
  }, [thresholdAmount]);

  const handleIncrement = (amount: number) => {
    const next = Math.max(10, thresholdAmount + amount);
    onUpdateThreshold(next);
  };

  const handleTextChange = (text: string) => {
    // Only allow numbers and one decimal dot
    const clean = text.replace(/[^0-9.]/g, '');
    setInputText(clean);
    const numeric = parseFloat(clean);
    if (!isNaN(numeric) && numeric >= 0) {
      onUpdateThreshold(numeric);
    }
  };

  const handleBlur = () => {
    const numeric = parseFloat(inputText);
    if (isNaN(numeric) || numeric <= 0) {
      setInputText('50');
      onUpdateThreshold(50);
    } else {
      setInputText(numeric.toString());
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AlertTriangle size={20} color={theme.colors.warning} />
          <Text style={styles.title}>Budget Alert Threshold</Text>
        </View>
        <Text style={styles.subtitle}>
          Trigger an interactive toaster alert when remaining pool balance drops below this amount.
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

        {/* Digital Numeric Keypad Input for Custom Threshold */}
        <View style={styles.amountDisplay}>
          <View style={styles.amountInputRow}>
            <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
            <TextInput
              style={styles.amountInput}
              value={inputText}
              onChangeText={handleTextChange}
              onBlur={handleBlur}
              keyboardType="decimal-pad"
              inputMode="decimal"
              selectTextOnFocus
              accessibilityRole="text"
              accessibilityLabel="Custom threshold amount input"
            />
            <Edit3 size={14} color={theme.colors.textMuted} style={styles.editIcon} />
          </View>
          <Text style={styles.alertTriggerText}>Tap amount to type on digital keypad</Text>
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
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginBottom: 14,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  amountDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginRight: 2,
  },
  amountInput: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    minWidth: 60,
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  editIcon: {
    marginLeft: 4,
    opacity: 0.6,
  },
  alertTriggerText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPresetPill: {
    backgroundColor: theme.colors.primary,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  selectedPresetText: {
    color: '#FFFFFF',
  },
});
