import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';

export type InsightPeriod = 'month' | 'quarter' | 'year';

interface PeriodSegmentedControlProps {
  selectedPeriod: InsightPeriod;
  onSelectPeriod: (period: InsightPeriod) => void;
}

export const PeriodSegmentedControl: React.FC<PeriodSegmentedControlProps> = ({
  selectedPeriod,
  onSelectPeriod,
}) => {
  const options: { id: InsightPeriod; label: string }[] = [
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' },
  ];

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {options.map((opt) => {
        const isSelected = selectedPeriod === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onSelectPeriod(opt.id)}
            style={[styles.segment, isSelected && styles.selectedSegment]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${opt.label} period`}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected && styles.selectedSegmentText,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: theme.borderRadius.full,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
  },
  selectedSegment: {
    backgroundColor: '#FFFFFF',
    ...theme.shadows.sm,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  selectedSegmentText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
