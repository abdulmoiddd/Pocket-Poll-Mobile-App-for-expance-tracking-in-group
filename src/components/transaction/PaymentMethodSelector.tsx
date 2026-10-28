import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PaymentMethod } from '../../types';
import { theme } from '../../theme';
import { Banknote, CreditCard, Landmark, Smartphone } from 'lucide-react-native';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

const METHODS: { id: PaymentMethod; label: string; icon: (color: string) => React.ReactNode }[] = [
  {
    id: 'Credit Card',
    label: 'Credit Card',
    icon: (c) => <CreditCard size={16} color={c} />,
  },
  {
    id: 'Debit Card',
    label: 'Debit Card',
    icon: (c) => <CreditCard size={16} color={c} />,
  },
  {
    id: 'Cash',
    label: 'Cash',
    icon: (c) => <Banknote size={16} color={c} />,
  },
  {
    id: 'Bank Transfer',
    label: 'Bank Transfer',
    icon: (c) => <Landmark size={16} color={c} />,
  },
  {
    id: 'Digital Wallet',
    label: 'Apple/G-Pay',
    icon: (c) => <Smartphone size={16} color={c} />,
  },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.grid}>
        {METHODS.map((item) => {
          const isSelected = selectedMethod === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelectMethod(item.id)}
              style={[
                styles.pill,
                isSelected && styles.selectedPill,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}, ${isSelected ? 'selected' : 'unselected'}`}
              accessibilityState={{ selected: isSelected }}
            >
              {item.icon(isSelected ? theme.colors.primary : theme.colors.textMuted)}
              <Text
                style={[
                  styles.pillText,
                  isSelected && styles.selectedPillText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  selectedPill: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  selectedPillText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
