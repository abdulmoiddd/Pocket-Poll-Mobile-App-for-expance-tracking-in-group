import React, { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PocketPoolProvider, usePocketPool } from './src/context/PocketPoolContext';
import { ToastProvider } from './src/context/ToastContext';
import { SplashScreen } from './src/screens/SplashScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { MembersScreen } from './src/screens/MembersScreen';
import { InsightScreen } from './src/screens/InsightScreen';
import { AddTransactionScreen } from './src/screens/AddTransactionScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BottomTabBar, TabName } from './src/components/navigation/BottomTabBar';
import { BiometricLockScreen } from './src/components/security/BiometricLockScreen';
import { theme } from './src/theme';
import { TransactionType } from './src/types';

function MainNavigator() {
  const { isLocked, unlockApp, settings } = usePocketPool();
  const [currentTab, setCurrentTab] = useState<TabName>('dashboard');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [initialAddType, setInitialAddType] = useState<TransactionType>('expense');

  const handleOpenAdd = (defaultType: TransactionType = 'expense') => {
    setInitialAddType(defaultType);
    setIsAddOpen(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={currentTab === 'dashboard' ? 'light-content' : 'dark-content'} />

      {/* Screen Render */}
      <View style={styles.screenContainer}>
        {currentTab === 'dashboard' && (
          <DashboardScreen
            onNavigateToAdd={handleOpenAdd}
            onNavigateToSettings={() => setCurrentTab('settings')}
            onNavigateToInsights={() => setCurrentTab('insights')}
            onNavigateToMembers={() => setCurrentTab('members')}
          />
        )}

        {currentTab === 'members' && (
          <MembersScreen
            onQuickDepositForMember={(member) => {
              handleOpenAdd('contribution');
            }}
          />
        )}

        {currentTab === 'insights' && <InsightScreen />}

        {currentTab === 'settings' && <SettingsScreen />}
      </View>

      {/* Modal: Add Expense / Contribution */}
      {isAddOpen && (
        <View style={styles.modalContainer}>
          <AddTransactionScreen
            initialType={initialAddType}
            onSuccess={() => setIsAddOpen(false)}
            onCancel={() => setIsAddOpen(false)}
          />
        </View>
      )}

      {/* Symmetrical Bottom Tab Bar: 2 Left (Pool, Members) + Center FAB (+) + 2 Right (Insights, Settings) */}
      {!isAddOpen && (
        <BottomTabBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onFabPress={() => handleOpenAdd('expense')}
        />
      )}

      {/* Security Biometric / PIN Lock Overlay */}
      {isLocked && (
        <BiometricLockScreen
          correctPin={settings.pinCode}
          onUnlocked={unlockApp}
          groupName={settings.groupName}
        />
      )}
    </View>
  );
}

export default function App() {
  const [isSplashDone, setIsSplashDone] = useState(false);

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <PocketPoolProvider>
          {!isSplashDone ? (
            <SplashScreen onFinish={() => setIsSplashDone(true)} />
          ) : (
            <MainNavigator />
          )}
        </PocketPoolProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: theme.colors.background,
  },
});
