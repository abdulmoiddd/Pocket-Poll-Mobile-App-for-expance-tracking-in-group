import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import { usePocketPool } from '../context/PocketPoolContext';
import { Header } from '../components/common/Header';
import { CurrencyPicker } from '../components/settings/CurrencyPicker';
import { ThresholdSlider } from '../components/settings/ThresholdSlider';
import { ExportManager } from '../components/settings/ExportManager';
import { theme } from '../theme';
import { useToast } from '../context/ToastContext';
import { BiometricsService } from '../services/biometrics';
import {
  Fingerprint,
  Lock,
  KeyRound,
  Database,
  RotateCcw,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  FileCode,
  Users,
} from 'lucide-react-native';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportReport,
    resetToDefaults,
    resetToZero,
    exportJSONBackup,
    importJSONBackup,
    lockApp,
    unreadAlertsCount,
  } = usePocketPool();
  const { toast } = useToast();

  // Draft / Staged preferences state
  const [draftSymbol, setDraftSymbol] = useState(settings.currencySymbol);
  const [draftCode, setDraftCode] = useState(settings.currencyCode);
  const [draftThreshold, setDraftThreshold] = useState(settings.thresholdAmount);
  const [draftGroupName, setDraftGroupName] = useState(settings.groupName);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Modals & Reset state
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [jsonModalVisible, setJsonModalVisible] = useState(false);
  const [jsonBackupText, setJsonBackupText] = useState('');
  const [resetModalMode, setResetModalMode] = useState<'demo' | 'zero' | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Sync draft state if settings are updated externally (e.g. after reset)
  useEffect(() => {
    setDraftSymbol(settings.currencySymbol);
    setDraftCode(settings.currencyCode);
    setDraftThreshold(settings.thresholdAmount);
    setDraftGroupName(settings.groupName);
  }, [
    settings.currencySymbol,
    settings.currencyCode,
    settings.thresholdAmount,
    settings.groupName,
  ]);

  const hasUnsavedChanges =
    draftSymbol !== settings.currencySymbol ||
    draftCode !== settings.currencyCode ||
    draftThreshold !== settings.thresholdAmount ||
    draftGroupName.trim() !== settings.groupName;

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateSettings({
        currencySymbol: draftSymbol,
        currencyCode: draftCode,
        thresholdAmount: draftThreshold,
        groupName: draftGroupName.trim() || settings.groupName,
      });
      toast.success(
        'Settings Saved',
        `Currency updated to ${draftSymbol} (${draftCode}) and threshold set to ${draftSymbol}${draftThreshold}.`
      );
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Could not save settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDiscardChanges = () => {
    setDraftSymbol(settings.currencySymbol);
    setDraftCode(settings.currencyCode);
    setDraftThreshold(settings.thresholdAmount);
    setDraftGroupName(settings.groupName);
    toast.info('Changes Discarded', 'Reverted draft settings to current saved values.');
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const status = await BiometricsService.checkAvailability();
      if (!status.hasHardware) {
        toast.warning(
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
      toast.success('PIN Updated', 'Your 4-digit security PIN has been saved.');
    } else {
      toast.error('Invalid PIN', 'Please enter exactly 4 digits.');
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
        toast.success('Success', 'Local JSON database restored successfully!');
      } else {
        toast.error('Error', 'Invalid PocketPool JSON backup format.');
      }
    } catch {
      toast.error('Error', 'Failed to parse JSON.');
    }
  };

  const handleConfirmReset = async () => {
    if (!resetModalMode) return;
    setIsResetting(true);
    try {
      if (resetModalMode === 'zero') {
        await resetToZero();
        toast.warning('App Reset', 'App reset to clean zero state! 0 members, 0 transactions.');
      } else {
        await resetToDefaults();
        toast.success('App Reset', 'Demo pool data and 4 members successfully restored!');
      }
      setResetModalMode(null);
    } catch (err: any) {
      toast.error('Reset Failed', err?.message || 'Could not reset data.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Header
          title="App Settings"
          subtitle="Preferences, Security & Data"
          variant="white"
          showLogo={true}
          unreadAlerts={unreadAlertsCount}
          onLockPress={settings.biometricEnabled ? lockApp : undefined}
        />

        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <View style={styles.unsavedBanner}>
            <View style={styles.unsavedBannerLeft}>
              <AlertTriangle size={18} color="#D97706" />
              <Text style={styles.unsavedBannerText}>
                You have unsaved changes. Tap "Save Settings" below to apply.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.quickSaveBtn}
              onPress={handleSaveSettings}
              disabled={isSavingSettings}
              accessibilityRole="button"
              accessibilityLabel="Quick save settings button"
            >
              <Text style={styles.quickSaveBtnText}>Save Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Group / Pool Name Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pool / Group Name</Text>
          <Text style={styles.cardSubtitle}>
            The display name shown across the app for this pool.
          </Text>
          <TextInput
            style={styles.groupInput}
            value={draftGroupName}
            onChangeText={setDraftGroupName}
            placeholder="e.g. Summer Trip Pool 2026"
            placeholderTextColor="#94A3B8"
            accessibilityLabel="Group name input"
          />
        </View>

        {/* Currency & Localization Picker */}
        <CurrencyPicker
          selectedSymbol={draftSymbol}
          selectedCode={draftCode}
          onSelectCurrency={(symbol, code) => {
            setDraftSymbol(symbol);
            setDraftCode(code);
          }}
        />

        {/* Budget Alert Threshold Slider */}
        <ThresholdSlider
          thresholdAmount={draftThreshold}
          currencySymbol={draftSymbol}
          onUpdateThreshold={(amount) => setDraftThreshold(amount)}
        />

        {/* Prominent Save Configuration Card */}
        <View style={[styles.card, hasUnsavedChanges && styles.saveCardActive]}>
          <View style={styles.saveHeaderRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.cardTitle}>Save Configuration</Text>
              <Text style={styles.cardSubtitle}>
                {hasUnsavedChanges
                  ? `Pending changes: ${
                      draftSymbol !== settings.currencySymbol
                        ? `Currency (${draftSymbol}) `
                        : ''
                    }${
                      draftThreshold !== settings.thresholdAmount
                        ? `Threshold (${draftSymbol}${draftThreshold}) `
                        : ''
                    }${
                      draftGroupName.trim() !== settings.groupName
                        ? `Group Name ("${draftGroupName.trim()}")`
                        : ''
                    }`
                  : 'All preferences are saved and active throughout the application.'}
              </Text>
            </View>
            {hasUnsavedChanges && (
              <View style={styles.unsavedBadge}>
                <Text style={styles.unsavedBadgeText}>Unsaved</Text>
              </View>
            )}
          </View>

          <View style={styles.saveButtonsRow}>
            <TouchableOpacity
              style={[
                styles.primarySaveBtn,
                !hasUnsavedChanges && styles.primarySaveBtnDisabled,
              ]}
              onPress={handleSaveSettings}
              disabled={!hasUnsavedChanges || isSavingSettings}
              accessibilityRole="button"
              accessibilityLabel="Save settings changes"
            >
              <Save size={18} color="#FFFFFF" />
              <Text style={styles.primarySaveBtnText}>
                {isSavingSettings ? 'Saving Settings...' : 'Save Settings'}
              </Text>
            </TouchableOpacity>

            {hasUnsavedChanges && (
              <TouchableOpacity
                style={styles.discardBtn}
                onPress={handleDiscardChanges}
                accessibilityRole="button"
                accessibilityLabel="Discard unsaved changes"
              >
                <Text style={styles.discardBtnText}>Discard</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

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
                <Text style={styles.settingDesc}>
                  View, export raw JSON, or restore database from backup
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Two Data Reset Options */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Reset Options</Text>
          <Text style={styles.cardSubtitle}>
            Choose between wiping all entries to zero or restoring the sample demo data.
          </Text>

          {/* Option 1: Reset App to Zero (Clean Slate) */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setResetModalMode('zero')}
            accessibilityRole="button"
            accessibilityLabel="Reset app to default zero state without demo data"
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <Trash2 size={20} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: '#DC2626' }]}>
                  Reset App to Zero (Clean Default)
                </Text>
                <Text style={styles.settingDesc}>
                  Wipe all transactions, members, and expenses. Set everything to zero with no demo data.
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>

          {/* Option 2: Restore Sample Demo Data */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0, marginTop: 4 }]}
            onPress={() => setResetModalMode('demo')}
            accessibilityRole="button"
            accessibilityLabel="Restore 4 sample members and demo transactions"
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
                <RotateCcw size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: theme.colors.primary }]}>
                  Reset to Demo Data
                </Text>
                <Text style={styles.settingDesc}>
                  Restore 4 sample members (Alex, Sarah, David, Emma) and initial demo transactions.
                </Text>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
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
              inputMode="numeric"
              maxLength={4}
              secureTextEntry
              value={newPin}
              onChangeText={(val) => setNewPin(val.replace(/[^0-9]/g, ''))}
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
        </KeyboardAvoidingView>
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

      {/* Reset Confirmation Modal (Handles both 'zero' and 'demo' modes) */}
      <Modal
        visible={resetModalMode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalMode(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalCard}>
            <View
              style={[
                styles.dangerIconCircle,
                {
                  backgroundColor:
                    resetModalMode === 'zero' ? '#FEE2E2' : '#EDE9FE',
                },
              ]}
            >
              {resetModalMode === 'zero' ? (
                <Trash2 size={28} color="#DC2626" />
              ) : (
                <RotateCcw size={28} color={theme.colors.primary} />
              )}
            </View>

            <Text style={styles.confirmTitle}>
              {resetModalMode === 'zero'
                ? 'Reset App to Zero (Clean Default)?'
                : 'Reset to Sample Demo Data?'}
            </Text>

            <Text style={styles.confirmSubtitle}>
              {resetModalMode === 'zero'
                ? 'This will wipe all transactions, expenses, contributions, and members, setting everything to zero ($0.00). No demo data will be loaded. Your pool will be completely empty and ready for your real entries.'
                : 'This will restore the 4 original sample members (Alex, Sarah, David, Emma) and reload the starting demo transactions ($2,800 budget, $1,850 expenses).'}
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                onPress={() => setResetModalMode(null)}
                disabled={isResetting}
                style={styles.confirmCancelBtn}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmReset}
                disabled={isResetting}
                style={[
                  styles.confirmResetBtn,
                  {
                    backgroundColor:
                      resetModalMode === 'zero'
                        ? '#DC2626'
                        : theme.colors.primary,
                  },
                ]}
              >
                <Text style={styles.confirmResetText}>
                  {isResetting
                    ? 'Resetting...'
                    : resetModalMode === 'zero'
                    ? 'Yes, Wipe to Zero'
                    : 'Yes, Restore Demo'}
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
  unsavedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
    gap: 10,
  },
  unsavedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  unsavedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    flex: 1,
  },
  quickSaveBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
  },
  quickSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  groupInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  saveCardActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: '#FAFAFF',
  },
  saveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  unsavedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  unsavedBadgeText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  saveButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  primarySaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.full,
    gap: 8,
    ...theme.shadows.button,
  },
  primarySaveBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  primarySaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  discardBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
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
    flex: 1.3,
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
    lineHeight: 15,
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
