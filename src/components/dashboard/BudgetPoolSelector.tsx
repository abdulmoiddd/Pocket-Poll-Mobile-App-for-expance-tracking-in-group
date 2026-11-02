import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { usePocketPool } from '../../context/PocketPoolContext';
import { useToast } from '../../context/ToastContext';
import { theme } from '../../theme';
import { BudgetPool } from '../../types';
import {
  Check,
  Plus,
  ChevronDown,
  X,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  FolderHeart,
  Calendar,
} from 'lucide-react-native';

export const BudgetPoolSelector: React.FC = () => {
  const {
    pools,
    activePoolId,
    activePool,
    switchPool,
    createPool,
    deletePool,
    renamePool,
    allTransactions,
  } = usePocketPool();
  const { toast } = useToast();

  const [modalVisible, setModalVisible] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolDesc, setNewPoolDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit / Rename state
  const [editingPool, setEditingPool] = useState<BudgetPool | null>(null);
  const [editPoolName, setEditPoolName] = useState('');

  const handleSelectPool = async (poolId: string) => {
    if (poolId === activePoolId) return;
    try {
      await switchPool(poolId);
      const target = pools.find((p) => p.id === poolId);
      toast.info('Switched Budget', `Now viewing ${target?.name || 'budget pool'}.`);
    } catch {
      toast.error('Switch Failed', 'Could not switch budget pool.');
    }
  };

  const handleCreatePool = async () => {
    const trimmed = newPoolName.trim();
    if (!trimmed) {
      toast.warning('Name Required', 'Please enter a name for your new budget pool.');
      return;
    }

    setIsCreating(true);
    try {
      const created = await createPool(trimmed, newPoolDesc.trim());
      setNewPoolName('');
      setNewPoolDesc('');
      setModalVisible(false);
      toast.success('Budget Created', `Started "${created.name}" budget pool.`);
    } catch {
      toast.error('Creation Failed', 'Failed to create budget pool.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameSubmit = async () => {
    if (!editingPool) return;
    const trimmed = editPoolName.trim();
    if (!trimmed) {
      toast.warning('Name Required', 'Please enter a valid pool name.');
      return;
    }

    try {
      await renamePool(editingPool.id, trimmed);
      setEditingPool(null);
      setEditPoolName('');
      toast.success('Budget Renamed', `Renamed pool to "${trimmed}".`);
    } catch {
      toast.error('Rename Failed', 'Could not rename budget pool.');
    }
  };

  const handleDeletePool = (pool: BudgetPool) => {
    if (pools.length <= 1) {
      Alert.alert('Cannot Delete', 'PocketPool requires at least one active budget pool.');
      return;
    }

    Alert.alert(
      'Delete Budget Pool',
      `Are you sure you want to delete "${pool.name}"? All associated transactions will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePool(pool.id);
              toast.info('Budget Deleted', `"${pool.name}" pool has been removed.`);
            } catch {
              toast.error('Error', 'Failed to delete budget pool.');
            }
          },
        },
      ]
    );
  };

  // Compute transaction counts for display in manager modal
  const getPoolTxCount = (poolId: string) => {
    return allTransactions.filter(
      (tx) => (tx.poolId || pools[0]?.id || 'pool_summer_trip') === poolId
    ).length;
  };

  return (
    <View style={styles.container}>
      {/* Horizontal Carousel of Budget Pools */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        accessibilityRole="tablist"
      >
        {pools.map((pool) => {
          const isActive = pool.id === activePoolId;
          return (
            <TouchableOpacity
              key={pool.id}
              onPress={() => {
                if (isActive) {
                  // Tapping active pill opens full switcher dropdown modal
                  setModalVisible(true);
                } else {
                  handleSelectPool(pool.id);
                }
              }}
              style={[styles.poolPill, isActive ? styles.activePill : styles.inactivePill]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${pool.name} budget pool. ${
                isActive ? 'Currently active. Tap to manage.' : 'Tap to switch.'
              }`}
            >
              {isActive ? (
                <>
                  <View style={styles.activeIconCircle}>
                    <Check size={11} color="#5A48D6" strokeWidth={3} />
                  </View>
                  <Text style={styles.activePillText} numberOfLines={1} ellipsizeMode="tail">
                    {pool.name}
                  </Text>
                  <ChevronDown size={14} color="#5A48D6" style={styles.chevronMargin} />
                </>
              ) : (
                <Text style={styles.inactivePillText} numberOfLines={1} ellipsizeMode="tail">
                  {pool.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* "+ New Pool" Pill */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.newPoolPill}
          accessibilityRole="button"
          accessibilityLabel="Create a new budget pool"
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.newPoolPillText}>New Pool</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Budget Pools Switcher & Manager Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => setModalVisible(false)}
              accessibilityLabel="Dismiss modal"
            />
          </View>

          <View style={styles.modalSheet}>
            {/* Modal Drag Indicator */}
            <View style={styles.dragHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Budget Pools</Text>
                <Text style={styles.modalSubtitle}>
                  Track trips, vacations & events independently
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* Pools List */}
              <Text style={styles.sectionHeading}>Existing Budgets ({pools.length})</Text>

              <View style={styles.poolsListContainer}>
                {pools.map((pool) => {
                  const isActive = pool.id === activePoolId;
                  const txCount = getPoolTxCount(pool.id);

                  return (
                    <View
                      key={pool.id}
                      style={[styles.poolItemCard, isActive && styles.poolItemCardActive]}
                    >
                      <TouchableOpacity
                        style={styles.poolItemMain}
                        onPress={() => {
                          handleSelectPool(pool.id);
                          setModalVisible(false);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Switch to ${pool.name}`}
                      >
                        <View
                          style={[
                            styles.radioIndicator,
                            isActive && styles.radioIndicatorActive,
                          ]}
                        >
                          {isActive && <View style={styles.radioDot} />}
                        </View>

                        <View style={styles.poolInfo}>
                          <View style={styles.poolTitleRow}>
                            <Text
                              style={[
                                styles.poolItemName,
                                isActive && styles.poolItemNameActive,
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {pool.name}
                            </Text>
                            {isActive && (
                              <View style={styles.activeTag}>
                                <Text style={styles.activeTagText}>ACTIVE</Text>
                              </View>
                            )}
                          </View>
                          {pool.description ? (
                            <Text style={styles.poolItemDesc} numberOfLines={2} ellipsizeMode="tail">
                              {pool.description}
                            </Text>
                          ) : null}
                          <Text style={styles.poolItemMeta} numberOfLines={1}>
                            {txCount} {txCount === 1 ? 'transaction' : 'transactions'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Item Actions */}
                      <View style={styles.poolItemActions}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingPool(pool);
                            setEditPoolName(pool.name);
                          }}
                          style={styles.actionIconButton}
                          accessibilityLabel={`Rename ${pool.name}`}
                        >
                          <Edit2 size={16} color={theme.colors.textSecondary} />
                        </TouchableOpacity>

                        {pools.length > 1 && (
                          <TouchableOpacity
                            onPress={() => handleDeletePool(pool)}
                            style={styles.actionIconButton}
                            accessibilityLabel={`Delete ${pool.name}`}
                          >
                            <Trash2 size={16} color={theme.colors.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Create New Budget Section */}
              <View style={styles.createSectionCard}>
                <View style={styles.createHeaderRow}>
                  <View style={styles.createIconBadge}>
                    <Plus size={16} color="#5A48D6" strokeWidth={3} />
                  </View>
                  <Text style={styles.createSectionTitle}>Create New Budget Pool</Text>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="e.g., Summer Trip, Office Party, Ski Weekend"
                  placeholderTextColor={theme.colors.textMuted}
                  value={newPoolName}
                  onChangeText={setNewPoolName}
                  maxLength={40}
                  accessibilityLabel="New budget pool name"
                />

                <TextInput
                  style={[styles.input, styles.inputDesc]}
                  placeholder="Optional description (e.g. Q4 Team celebration)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={newPoolDesc}
                  onChangeText={setNewPoolDesc}
                  maxLength={100}
                  accessibilityLabel="New budget pool description"
                />

                <TouchableOpacity
                  onPress={handleCreatePool}
                  disabled={isCreating}
                  style={[styles.createSubmitButton, isCreating && styles.buttonDisabled]}
                  accessibilityRole="button"
                  accessibilityLabel="Create Budget Pool"
                >
                  <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.createSubmitText}>
                    {isCreating ? 'Creating...' : 'Create Budget Pool'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Rename Budget Pool Modal */}
      {editingPool && (
        <Modal
          visible={!!editingPool}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingPool(null)}
        >
          <View style={styles.renameModalOverlay}>
            <View style={styles.renameCard}>
              <Text style={styles.renameTitle}>Rename Budget Pool</Text>
              <Text style={styles.renameSubtitle}>Enter a new name for this pool</Text>

              <TextInput
                style={styles.renameInput}
                value={editPoolName}
                onChangeText={setEditPoolName}
                autoFocus
                maxLength={40}
                placeholder="Budget Name"
                placeholderTextColor={theme.colors.textMuted}
              />

              <View style={styles.renameActionsRow}>
                <TouchableOpacity
                  style={styles.renameCancelButton}
                  onPress={() => setEditingPool(null)}
                >
                  <Text style={styles.renameCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.renameSaveButton}
                  onPress={handleRenameSubmit}
                >
                  <Text style={styles.renameSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 4,
  },
  carouselContent: {
    paddingVertical: 4,
    alignItems: 'center',
    gap: 8,
  },
  poolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  activePill: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  inactivePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(90, 72, 214, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  activePillText: {
    color: '#5A48D6',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: -0.2,
    maxWidth: 160,
  },
  chevronMargin: {
    marginLeft: 4,
  },
  inactivePillText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    maxWidth: 160,
  },
  newPoolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.55)',
    gap: 4,
  },
  newPoolPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  // Switcher Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingVertical: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  poolsListContainer: {
    gap: 8,
    marginBottom: 20,
  },
  poolItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
  },
  poolItemCardActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7B66FF',
    borderWidth: 1.5,
  },
  poolItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioIndicatorActive: {
    borderColor: '#5A48D6',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5A48D6',
  },
  poolInfo: {
    flex: 1,
  },
  poolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  poolItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flexShrink: 1,
    maxWidth: 200,
  },
  poolItemNameActive: {
    color: '#5A48D6',
  },
  activeTag: {
    backgroundColor: '#7B66FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  poolItemDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  poolItemMeta: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  poolItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    flexShrink: 0,
  },
  actionIconButton: {
    padding: 6,
    borderRadius: 8,
  },

  // Create section
  createSectionCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  createHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  createIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(123, 102, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  inputDesc: {
    fontSize: 13,
  },
  createSubmitButton: {
    backgroundColor: '#5A48D6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Rename Dialog
  renameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  renameCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  renameTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  renameSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  renameInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  renameActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  renameCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  renameCancelText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  renameSaveButton: {
    backgroundColor: '#5A48D6',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  renameSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
