import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { usePocketPool } from '../context/PocketPoolContext';
import { useToast } from '../context/ToastContext';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { theme } from '../theme';
import { Member, PaymentMethod } from '../types';
import { formatCurrency } from '../services/calculations';
import {
  UserPlus,
  Users,
  TrendingUp,
  X,
  Mail,
  Phone,
  Trash2,
  Calendar,
  Check,
  ArrowDownLeft,
  DollarSign,
  Edit3,
} from 'lucide-react-native';

const AVATAR_PALETTE = [
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#F43F5E', // Rose
];

interface MembersScreenProps {
  onQuickDepositForMember?: (member: Member) => void;
}

export const MembersScreen: React.FC<MembersScreenProps> = ({ onQuickDepositForMember }) => {
  const {
    members,
    transactions,
    settings,
    addMember,
    deleteMember,
    updateSettings,
    unreadAlertsCount,
    lockApp,
  } = usePocketPool();
  const { toast } = useToast();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_PALETTE[0]);
  const [initialDeposit, setInitialDeposit] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group name editing
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState(settings.groupName);

  // Member delete confirmation modal
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<Member | null>(null);

  // Quick Deposit modal
  const [depositTargetMember, setDepositTargetMember] = useState<Member | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // Total contributed to the pool
  const totalPoolFund = members.reduce((sum, m) => sum + (Number(m.totalContributed) || 0), 0);
  const avgContribution = members.length > 0 ? totalPoolFund / members.length : 0;

  const handleOpenAddModal = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSelectedColor(AVATAR_PALETTE[members.length % AVATAR_PALETTE.length]);
    setInitialDeposit('');
    setAddModalVisible(true);
  };

  const handleCreateMember = async () => {
    if (!name.trim()) {
      toast.error('Name Required', 'Please enter a name for the new member.');
      return;
    }

    const parsedDeposit = parseFloat(initialDeposit);
    setIsSubmitting(true);
    try {
      await addMember({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        avatarColor: selectedColor,
        initialDeposit: !isNaN(parsedDeposit) && parsedDeposit > 0 ? parsedDeposit : undefined,
        paymentMethod,
      });

      setAddModalVisible(false);
      setName('');
      setEmail('');
      setPhone('');
      setInitialDeposit('');

      toast.success(
        'Member Added',
        `${name.trim()} has been added to ${settings.groupName}!`
      );
    } catch (err: any) {
      toast.error('Error', err?.message || 'Failed to add member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteMemberTarget) {
      const removedName = deleteMemberTarget.name;
      await deleteMember(deleteMemberTarget.id);
      setDeleteMemberTarget(null);
      toast.info('Member Removed', `${removedName} was removed from the pool.`);
    }
  };

  const handleSaveGroupName = async () => {
    if (groupNameInput.trim()) {
      await updateSettings({ groupName: groupNameInput.trim() });
      setIsEditingGroupName(false);
      toast.success('Group Name Saved', `Renamed pool group to "${groupNameInput.trim()}".`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Header
          title="Group Members"
          subtitle={`${settings.groupName} • ${members.length} People`}
          variant="white"
          showLogo={true}
          unreadAlerts={unreadAlertsCount}
          onLockPress={settings.biometricEnabled ? lockApp : undefined}
          rightAction={
            <TouchableOpacity
              onPress={() => {
                setGroupNameInput(settings.groupName);
                setIsEditingGroupName(true);
              }}
              style={styles.headerEditBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit group name"
            >
              <Edit3 size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          }
        />

        {/* Group Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryLabel}>TOTAL GROUP MEMBERS</Text>
              <Text style={styles.summaryHeroCount}>{members.length} Members</Text>
            </View>
            <View style={styles.summaryIconBox}>
              <Users size={28} color={theme.colors.primary} />
            </View>
          </View>

          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.statLabel}>Total Contributed</Text>
              <Text style={styles.statValuePositive}>
                +{formatCurrency(totalPoolFund, settings.currencySymbol)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.statLabel}>Avg per Member</Text>
              <Text style={styles.statValue}>
                {formatCurrency(avgContribution, settings.currencySymbol)}
              </Text>
            </View>
          </View>
        </View>

        {/* Prominent Action Button: Add Person to Group */}
        <View style={styles.actionBtnContainer}>
          <Button
            title="+ Add Person to Group"
            onPress={handleOpenAddModal}
            size="lg"
            icon={<UserPlus size={20} color="#FFFFFF" />}
            accessibilityLabel="Add new person to group"
          />
        </View>

        {/* Members List */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            Active Members ({members.length})
          </Text>

          {members.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={40} color={theme.colors.textMuted} />
              <Text style={styles.emptyTitle}>No Members in Group</Text>
              <Text style={styles.emptySubtitle}>
                Tap the button above to add friends, family, or trip members.
              </Text>
            </View>
          ) : (
            <View style={styles.memberList}>
              {members.map((member) => {
                const initials =
                  member.avatarText ||
                  member.name
                    .split(' ')
                    .map((p) => p[0])
                    .filter(Boolean)
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                // Compute member contribution count
                const contributionCount = transactions.filter(
                  (tx) => tx.type === 'contribution' && tx.memberId === member.id
                ).length;

                return (
                  <View
                    key={member.id}
                    style={styles.memberCard}
                    accessibilityRole="text"
                    accessibilityLabel={`${member.name}, Total contributed: ${formatCurrency(
                      member.totalContributed,
                      settings.currencySymbol
                    )}`}
                  >
                    <View style={styles.memberMainRow}>
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: member.avatarColor || theme.colors.primary },
                        ]}
                      >
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>

                      <View style={styles.memberInfoCol}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <View style={styles.metaRow}>
                          {member.email ? (
                            <View style={styles.metaItem}>
                              <Mail size={12} color={theme.colors.textMuted} />
                              <Text style={styles.metaText} numberOfLines={1}>
                                {member.email}
                              </Text>
                            </View>
                          ) : member.phone ? (
                            <View style={styles.metaItem}>
                              <Phone size={12} color={theme.colors.textMuted} />
                              <Text style={styles.metaText}>{member.phone}</Text>
                            </View>
                          ) : (
                            <View style={styles.metaItem}>
                              <Calendar size={12} color={theme.colors.textMuted} />
                              <Text style={styles.metaText}>Joined {member.joinedAt}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.memberContributionCol}>
                        <Text style={styles.memberDepositAmount}>
                          +{formatCurrency(member.totalContributed, settings.currencySymbol)}
                        </Text>
                        <Text style={styles.depositCountText}>
                          {contributionCount} {contributionCount === 1 ? 'deposit' : 'deposits'}
                        </Text>
                      </View>
                    </View>

                    {/* Member actions */}
                    <View style={styles.memberCardFooter}>
                      <TouchableOpacity
                        onPress={() => {
                          if (onQuickDepositForMember) {
                            onQuickDepositForMember(member);
                          }
                        }}
                        style={styles.quickDepositBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Record deposit for ${member.name}`}
                      >
                        <ArrowDownLeft size={14} color="#059669" />
                        <Text style={styles.quickDepositText}>Record Deposit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setDeleteMemberTarget(member)}
                        style={styles.removeMemberBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${member.name} from group`}
                      >
                        <Trash2 size={15} color={theme.colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Person Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconBox}>
                  <UserPlus size={22} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Add Person to Group</Text>
                  <Text style={styles.modalSubtitle}>Join {settings.groupName}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
              style={{ maxHeight: 460 }}
            >
              {/* Full Name */}
              <Text style={styles.inputLabel}>FULL NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Jordan Miller"
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />

              {/* Email / Contact */}
              <Text style={styles.inputLabel}>EMAIL (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="jordan@example.com"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                inputMode="email"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              {/* Phone */}
              <Text style={styles.inputLabel}>PHONE (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 019-2834"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
                inputMode="tel"
                value={phone}
                onChangeText={setPhone}
              />

              {/* Avatar Color Picker */}
              <Text style={styles.inputLabel}>AVATAR COLOR</Text>
              <View style={styles.colorPaletteRow}>
                {AVATAR_PALETTE.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        isSelected && styles.selectedColorCircle,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select color ${color}`}
                    >
                      {isSelected && <Check size={14} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Initial Contribution */}
              <Text style={styles.inputLabel}>
                INITIAL DEPOSIT / CONTRIBUTION (OPTIONAL)
              </Text>
              <View style={styles.depositInputWrapper}>
                <Text style={styles.currencyPrefix}>{settings.currencySymbol}</Text>
                <TextInput
                  style={styles.depositInput}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  value={initialDeposit}
                  onChangeText={setInitialDeposit}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateMember}
                disabled={isSubmitting || !name.trim()}
                style={[
                  styles.saveBtn,
                  (!name.trim() || isSubmitting) && styles.disabledSaveBtn,
                ]}
              >
                <Text style={styles.saveBtnText}>
                  {isSubmitting ? 'Adding...' : 'Add Member to Pool'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Member Confirmation Modal */}
      <Modal
        visible={!!deleteMemberTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteMemberTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalCard}>
            <View style={styles.dangerIconCircle}>
              <Trash2 size={24} color={theme.colors.danger} />
            </View>
            <Text style={styles.confirmTitle}>Remove Member?</Text>
            <Text style={styles.confirmSubtitle}>
              Are you sure you want to remove {deleteMemberTarget?.name} from {settings.groupName}?
              Their recorded transactions will remain in pool history.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                onPress={() => setDeleteMemberTarget(null)}
                style={styles.confirmCancelBtn}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmDelete}
                style={styles.confirmDeleteBtn}
              >
                <Text style={styles.confirmDeleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Group Name Modal */}
      <Modal
        visible={isEditingGroupName}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingGroupName(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.confirmModalCard}>
            <Text style={styles.confirmTitle}>Edit Group Name</Text>
            <Text style={styles.confirmSubtitle}>
              Change the name of this shared pool group.
            </Text>

            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              value={groupNameInput}
              onChangeText={setGroupNameInput}
              placeholder="e.g. Kyoto Trip 2026"
              autoFocus
            />

            <View style={styles.confirmActions}>
              <TouchableOpacity
                onPress={() => setIsEditingGroupName(false)}
                style={styles.confirmCancelBtn}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveGroupName}
                style={styles.saveBtn}
              >
                <Text style={styles.saveBtnText}>Save Name</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  headerEditBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    ...theme.shadows.sm,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  summaryHeroCount: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  summaryIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  summaryStatItem: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  statValuePositive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  actionBtnContainer: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  membersSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  memberList: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...theme.shadows.sm,
  },
  memberMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  memberInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  memberContributionCol: {
    alignItems: 'flex-end',
  },
  memberDepositAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  depositCountText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  memberCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  quickDepositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
  },
  quickDepositText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  removeMemberBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.borderRadius.full,
    borderTopRightRadius: theme.borderRadius.full,
    padding: 24,
    paddingBottom: 40,
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    fontSize: 15,
    color: theme.colors.textPrimary,
    backgroundColor: '#F8FAFC',
  },
  colorPaletteRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorCircle: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...theme.shadows.sm,
  },
  depositInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginRight: 6,
  },
  depositInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.full,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.button,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledSaveBtn: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  dangerIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
    marginVertical: 10,
    lineHeight: 18,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.danger,
  },
  confirmDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
