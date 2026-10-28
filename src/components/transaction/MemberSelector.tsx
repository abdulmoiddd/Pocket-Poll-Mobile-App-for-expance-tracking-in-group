import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { Member } from '../../types';
import { theme } from '../../theme';
import { Plus, Check, UserPlus, X } from 'lucide-react-native';

interface MemberSelectorProps {
  members: Member[];
  selectedMemberId: string;
  onSelectMember: (memberId: string) => void;
  onAddNewMember?: (name: string) => Promise<void>;
  label?: string;
}

export const MemberSelector: React.FC<MemberSelectorProps> = ({
  members,
  selectedMemberId,
  onSelectMember,
  onAddNewMember,
  label = 'Select Member',
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const handleCreateMember = async () => {
    if (newMemberName.trim() && onAddNewMember) {
      await onAddNewMember(newMemberName.trim());
      setNewMemberName('');
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{label}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {members.map((member) => {
          const isSelected = member.id === selectedMemberId;
          const initials =
            member.avatarText ||
            member.name
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

          return (
            <TouchableOpacity
              key={member.id}
              onPress={() => onSelectMember(member.id)}
              style={[
                styles.memberPill,
                isSelected && styles.selectedPill,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${member.name}, ${isSelected ? 'selected' : 'unselected'}`}
              accessibilityState={{ selected: isSelected }}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: member.avatarColor || theme.colors.primary },
                ]}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text
                style={[
                  styles.memberName,
                  isSelected && styles.selectedMemberName,
                ]}
              >
                {member.name.split(' ')[0]}
              </Text>
              {isSelected && <Check size={14} color={theme.colors.primary} />}
            </TouchableOpacity>
          );
        })}

        {onAddNewMember && (
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={styles.addMemberButton}
            accessibilityRole="button"
            accessibilityLabel="Add new member"
          >
            <Plus size={16} color={theme.colors.primary} />
            <Text style={styles.addMemberText}>Add Member</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add Member Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <UserPlus size={20} color={theme.colors.primary} />
                <Text style={styles.modalTitle}>Add New Group Member</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Full Name (e.g. Liam Smith)"
              placeholderTextColor={theme.colors.textMuted}
              value={newMemberName}
              onChangeText={setNewMemberName}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateMember}
                disabled={!newMemberName.trim()}
                style={[
                  styles.saveBtn,
                  !newMemberName.trim() && styles.disabledBtn,
                ]}
              >
                <Text style={styles.saveBtnText}>Add to Pool</Text>
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
    marginVertical: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollList: {
    gap: 8,
    paddingVertical: 2,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: 8,
  },
  selectedPill: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  selectedMemberName: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    gap: 6,
  },
  addMemberText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.full,
  },
  cancelBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.full,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  disabledBtn: {
    backgroundColor: '#CBD5E1',
  },
});
