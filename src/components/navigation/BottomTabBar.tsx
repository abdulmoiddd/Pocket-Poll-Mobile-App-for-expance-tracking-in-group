import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { LayoutDashboard, PieChart, Settings, Plus } from 'lucide-react-native';

export type TabName = 'dashboard' | 'insights' | 'settings';

interface BottomTabBarProps {
  currentTab: TabName;
  onSelectTab: (tab: TabName) => void;
  onFabPress: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onSelectTab,
  onFabPress,
}) => {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.wrapper, { paddingBottom }]}>
      <View style={styles.bar}>
        {/* Dashboard Tab */}
        <TouchableOpacity
          onPress={() => onSelectTab('dashboard')}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentTab === 'dashboard' }}
          accessibilityLabel="Dashboard Home Tab"
        >
          <LayoutDashboard
            size={22}
            color={currentTab === 'dashboard' ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'dashboard' && styles.selectedTabLabel,
            ]}
          >
            Pool
          </Text>
        </TouchableOpacity>

        {/* Insights Tab */}
        <TouchableOpacity
          onPress={() => onSelectTab('insights')}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentTab === 'insights' }}
          accessibilityLabel="Insights and Analytics Tab"
        >
          <PieChart
            size={22}
            color={currentTab === 'insights' ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'insights' && styles.selectedTabLabel,
            ]}
          >
            Insights
          </Text>
        </TouchableOpacity>

        {/* Central Floating Action Button (+ button) per requirements */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            onPress={onFabPress}
            activeOpacity={0.85}
            style={styles.fabShadow}
            accessibilityRole="button"
            accessibilityLabel="Add Expense or Contribution to Pool"
          >
            <LinearGradient
              colors={theme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Plus size={28} color="#FFFFFF" strokeWidth={2.8} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Settings Tab */}
        <TouchableOpacity
          onPress={() => onSelectTab('settings')}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentTab === 'settings' }}
          accessibilityLabel="Settings Tab"
        >
          <Settings
            size={22}
            color={currentTab === 'settings' ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'settings' && styles.selectedTabLabel,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...theme.shadows.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 60,
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 3,
  },
  selectedTabLabel: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  fabContainer: {
    position: 'relative',
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
  },
  fabShadow: {
    ...theme.shadows.button,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
});
