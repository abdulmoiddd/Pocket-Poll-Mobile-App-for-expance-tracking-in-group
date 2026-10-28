import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { LayoutDashboard, Users, PieChart, Settings, Plus } from 'lucide-react-native';

export type TabName = 'dashboard' | 'members' | 'insights' | 'settings';

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
  const paddingBottom = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.wrapper, { paddingBottom }]}>
      <View style={styles.bar}>
        {/* LEFT OPTION 1: Pool Dashboard */}
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

        {/* LEFT OPTION 2: Members Group */}
        <TouchableOpacity
          onPress={() => onSelectTab('members')}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentTab === 'members' }}
          accessibilityLabel="Group Members Tab"
        >
          <Users
            size={22}
            color={currentTab === 'members' ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'members' && styles.selectedTabLabel,
            ]}
          >
            Members
          </Text>
        </TouchableOpacity>

        {/* CENTER: Floating Action Button (+) */}
        <View style={styles.fabSlot}>
          <TouchableOpacity
            onPress={onFabPress}
            activeOpacity={0.88}
            style={styles.fabShadow}
            accessibilityRole="button"
            accessibilityLabel="Add Expense or Deposit to Pool"
          >
            <LinearGradient
              colors={theme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Plus size={28} color="#FFFFFF" strokeWidth={3} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* RIGHT OPTION 1: Insights & Analytics */}
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

        {/* RIGHT OPTION 2: Settings */}
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
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 8,
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
  fabSlot: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    top: -20,
    zIndex: 10,
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
