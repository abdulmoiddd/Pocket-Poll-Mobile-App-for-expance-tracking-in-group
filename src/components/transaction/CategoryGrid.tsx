import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ExpenseCategory } from '../../types';
import { theme } from '../../theme';
import {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Receipt,
  MoreHorizontal,
} from 'lucide-react-native';

interface CategoryGridProps {
  selectedCategory: ExpenseCategory;
  onSelectCategory: (category: ExpenseCategory) => void;
}

interface CategoryItemConfig {
  id: ExpenseCategory;
  label: string;
  color: string;
  lightColor: string;
  icon: (color: string) => React.ReactNode;
}

export const CATEGORY_CONFIGS: CategoryItemConfig[] = [
  {
    id: 'Food',
    label: 'Food',
    color: theme.colors.food, // Orange
    lightColor: theme.colors.foodLight,
    icon: (c) => <Utensils size={24} color={c} />,
  },
  {
    id: 'Transport',
    label: 'Transport',
    color: theme.colors.transport, // Deep Blue
    lightColor: theme.colors.transportLight,
    icon: (c) => <Car size={24} color={c} />,
  },
  {
    id: 'Shopping',
    label: 'Shopping',
    color: theme.colors.shopping, // Bright Green
    lightColor: theme.colors.shoppingLight,
    icon: (c) => <ShoppingBag size={24} color={c} />,
  },
  {
    id: 'Fun',
    label: 'Fun',
    color: theme.colors.fun, // Pink
    lightColor: theme.colors.funLight,
    icon: (c) => <Gamepad2 size={24} color={c} />,
  },
  {
    id: 'Bills',
    label: 'Bills',
    color: theme.colors.bills, // Purple
    lightColor: theme.colors.billsLight,
    icon: (c) => <Receipt size={24} color={c} />,
  },
  {
    id: 'Other',
    label: 'Other',
    color: theme.colors.other, // Gray
    lightColor: theme.colors.otherLight,
    icon: (c) => <MoreHorizontal size={24} color={c} />,
  },
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.grid}>
      {CATEGORY_CONFIGS.map((item) => {
        const isSelected = selectedCategory === item.id;

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelectCategory(item.id)}
            activeOpacity={0.75}
            style={[
              styles.tile,
              { backgroundColor: item.lightColor },
              isSelected && {
                borderColor: item.color,
                borderWidth: 2,
                transform: [{ scale: 1.02 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${item.label} category, ${isSelected ? 'selected' : 'not selected'}`}
            accessibilityState={{ selected: isSelected }}
          >
            <View style={styles.iconWrapper}>{item.icon(item.color)}</View>
            <Text
              style={[
                styles.label,
                { color: isSelected ? item.color : theme.colors.textPrimary },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '31%',
    aspectRatio: 1.15,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...theme.shadows.sm,
  },
  iconWrapper: {
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});
