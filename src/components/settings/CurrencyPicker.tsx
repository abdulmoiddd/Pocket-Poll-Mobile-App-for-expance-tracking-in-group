import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { Check } from 'lucide-react-native';

interface CurrencyPickerProps {
  selectedSymbol: string;
  selectedCode: string;
  onSelectCurrency: (symbol: string, code: string) => void;
}

const CURRENCIES = [
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '₨', code: 'PKR', name: 'Pakistani Rupee' },
  { symbol: 'Fr', code: 'CHF', name: 'Swiss Franc' },
];

export const CurrencyPicker: React.FC<CurrencyPickerProps> = ({
  selectedSymbol,
  selectedCode,
  onSelectCurrency,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Currency & Localization</Text>
      <Text style={styles.subtitle}>Select default currency symbol and code</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {CURRENCIES.map((curr) => {
          const isSelected = selectedCode === curr.code;
          return (
            <TouchableOpacity
              key={curr.code}
              onPress={() => onSelectCurrency(curr.symbol, curr.code)}
              style={[
                styles.item,
                isSelected && styles.selectedItem,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${curr.name} (${curr.symbol} ${curr.code}), ${
                isSelected ? 'selected' : 'not selected'
              }`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.symbol,
                  isSelected && styles.selectedText,
                ]}
              >
                {curr.symbol}
              </Text>
              <Text
                style={[
                  styles.code,
                  isSelected && styles.selectedCode,
                ]}
              >
                {curr.code}
              </Text>
              {isSelected && (
                <View style={styles.checkIcon}>
                  <Check size={12} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  scrollContainer: {
    gap: 10,
    paddingVertical: 2,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    minWidth: 70,
  },
  selectedItem: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  symbol: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  code: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  selectedText: {
    color: theme.colors.primary,
  },
  selectedCode: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
