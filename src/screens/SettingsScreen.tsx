import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { usePocketPool } from '../context/PocketPoolContext';
import { Header } from '../components/common/Header';
import { CurrencyPicker } from '../components/settings/CurrencyPicker';
import { ThresholdSlider } from '../components/settings/ThresholdSlider';
import { ExportManager } from '../components/settings/ExportManager';
import { theme } from '../theme';
import { BiometricsService } from '../services/biometrics';
import {
  Fingerprint,
  Lock,
  KeyRound,
  Database,
  RotateCcw,
  Info,
  ShieldCheck,
  ChevronRight,
  FileCode,
  CheckCircle,
} from 'lucide-react-native';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportReport,
    resetToDefaults,
    exportJSONBackup,
    importJSONBackup,
    lockApp,
    unreadAlertsCount,
  } = usePocketPool();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [jsonModalVisible, setJsonModalVisible] = useState(false);
  const [jsonBackupText, setJsonBackupText] = useState('');
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetToast, setResetToast] = useState<string | null>(null);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Check hardware capability
      const status = await BiometricsService.checkAvailability();
      if (!status.hasHardware) {
        Alert.alert(
          'Biometrics Not Detected',
          'Biometric hardware is not detected on this device. Fallback PIN will be used for locking PocketPool.'
        );
      }
      await updateSettings({ biometricEnabled: true });
    } else {
      await updateSettings({ biometricEnabled: false });
    }
  };

  const handleSavePin = async () => {
    if (newPin.trim().length === 4 && /^\d+$/.test(newPin)) {
      await updateSettings({ pinCode: newPin });
      setNewPin('');
      setPinModalVisible(false);
      Alert.alert('PIN Updated', 'Your 4-digit security PIN has been saved.');
    } else {
      Alert.alert('Invalid PIN', 'Please enter exactly 4 digits.');
    }
  };

  const handleOpenJSONBackup = async () => {
    const json = await exportJSONBackup();
    setJsonBackupText(json);
    setJsonModalVisible(true);
  };

  const handleImportJSON = async () => {
    try {
      const ok = await importJSONBackup(jsonBackupText);
      if (ok) {
        setJsonModalVisible(false);
        Alert.alert('Success', 'Local JSON database restored successfully!');
      } else {
        Alert.alert('Error', 'Invalid PocketPool JSON backup format.');
      }
    } catch {
      Alert.alert('Error', 'Failed to parse JSON.');
    }
  };

  const handleReset = () => {
    setResetModalVisible(true);
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetToDefaults();
      setResetModalVisible(false);
      setResetToast('Demo pool data and members successfully restored!');
      setTimeout(() => setResetToast(null), 4000);
    } catch (err: any) {
      Alert.alert('Reset Failed', err?.message || 'Could not reset data.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header
          title="App Settings"
          subtitle="Preferences, Security & Data"
          variant="white"
          showLogo={true}
          unreadAlerts={unreadAlertsCount}
          onLockPress={settings.biometricEnabled ? lockApp : undefined}
        />

        {resetToast && (
          <View style={styles.toastBanner}>
            <CheckCircle size={18} color="#059669" />
            <Text style={styles.toastText}>{resetToast}</Text>
          </View>
        )}

        {/* Currency & Localization Picker */}
        <CurrencyPicker
          selectedSymbol={settings.currencySymbol}
          selectedCode={settings.currencyCode}
          onSelectCurrency={(symbol, code) =>
            updateSettings({ currencySymbol: symbol, currencyCode: code })
          }
        />

        {/* Budget Alert Threshold Slider */}
        <ThresholdSlider
          thresholdAmount={settings.thresholdAmount}
          currencySymbol={settings.currencySymbol}
          onUpdateThreshold={(amount) => updateSettings({ thresholdAmount: amount })}
        />

        {/* Invoicing & Data Export (PDF & CSV) */}
        <ExportManager
          onExport={async (format, timeframe) => {
            return exportReport(format, timeframe);
          }}
        />

        {/* Security & Biometrics Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Security &amp; Privacy</Text>
          <Text style={styles.cardSubtitle}>
            Protect financial data with FaceID, TouchID, or PIN on launch.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
                <Fingerprint size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Biometric Lock on Launch</Text>
                <Text style={styles.settingDesc}>
                  Require FaceID/TouchID/PIN when app opens
                </Text>
              </View>
            </View>
            <Switch
              value={settings.biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setPinModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Change security PIN"
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <KeyRound size={20} color="#D97706" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Change 4-Digit PIN</Text>
                <Text style={styles.settingDesc}>Current PIN: ••••</Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>

          {settings.biometricEnabled && (
            <TouchableOpacity
              style={styles.lockNowBtn}
              onPress={lockApp}
              accessibilityRole="button"
              accessibilityLabel="Lock app right now"
            >
              <Lock size={16} color="#FFFFFF" />
              <Text style={styles.lockNowText}>Lock PocketPool Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Local JSON Database Management */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Local Storage &amp; Backup</Text>
          <Text style={styles.cardSubtitle}>
            100% offline, local JSON architecture. No cloud or external backend required.
          </Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleOpenJSONBackup}
            accessibilityRole="button"
            accessibilityLabel="View and edit local JSON database backup"
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                <FileCode size={20} color="#059669" />
              </View>
              <View>
                <Text style={styles.settingLabel}>JSON Database Manager</Text>
                <Text style={styles.settingDesc}>Backup, inspect, or restore raw JSON data</Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="Reset database to default demo data"
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <RotateCcw size={20} color={theme.colors.danger} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: theme.colors.danger }]}>
                  Reset Demo Pool Data
                </Text>
                <Text style={styles.settingDesc}>Restore original demo contributions and expenses</Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* App Version Info */}
        <View style={styles.infoFooter}>
          <Text style={styles.infoText}>PocketPool v2.0.0 &bull; Local-First Architecture</Text>
          <Text style={styles.infoSubtext}>Designed according to Requirements V2 specifications</Text>
        </View>
      </ScrollView>

      {/* Change PIN Modal */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set 4-Digit Security PIN</Text>
            <Text style={styles.modalSubtitle}>
              Used to unlock PocketPool if biometrics fail or are unavailable.
            </Text>

            <TextInput
              style={styles.pinInput}
              placeholder="1234"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setPinModalVisible(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSavePin}
                style={styles.modalSave}
              >
                <Text style={styles.modalSaveText}>Save PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Raw JSON Database Backup Modal */}
      <Modal
        visible={jsonModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setJsonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Local JSON Database</Text>
            <Text style={styles.modalSubtitle}>
              Complete offline data snapshot stored on device.
            </Text>

            <ScrollView style={styles.jsonScrollView}>
              <TextInput
                style={styles.jsonInput}
                multiline
                value={jsonBackupText}
                onChangeText={setJsonBackupText}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setJsonModalVisible(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleImportJSON}
                style={styles.modalSave}
              >
                <Text style={styles.modalSaveText}>Restore JSON</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset to Demo Confirmation Modal */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalCard}>
            <View style={styles.dangerIconCircle}>
              <RotateCcw size={28} color={theme.colors.danger} />
            </View>
            <Text style={styles.confirmTitle}>Reset to Demo Pool Data?</Text>
            <Text style={styles.confirmSubtitle}>
              This will restore the original demo members (Alex, Sarah, David, Emma), reload the starting contributions, and reset budget thresholds to default.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                onPress={() => setResetModalVisible(false)}
                disabled={isResetting}
                style={styles.confirmCancelBtn}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmReset}
                disabled={isResetting}
                style={styles.confirmResetBtn}
              >
                <Text style={styles.confirmResetText}>
                  {isResetting ? 'Resetting...' : 'Yes, Reset to Demo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    flex: 1,
  },
  confirmModalCard: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 24,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  dangerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  confirmResetBtn: {
    flex: 1.2,
    backgroundColor: theme.colors.danger,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.button,
  },
  confirmResetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 90,
  },
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
    lineHeight: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  settingDesc: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  lockNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  lockNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  infoFooter: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  infoSubtext: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 22,
    ...theme.shadows.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  pinInput: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 10,
    color: theme.colors.textPrimary,
    marginBottom: 20,
  },
  jsonScrollView: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  jsonInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: theme.colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  modalSave: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.full,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
