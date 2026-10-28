import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { Camera, Paperclip, X, FileCheck } from 'lucide-react-native';

interface ReceiptAttachmentAreaProps {
  receiptName?: string;
  onAttachReceipt: (name: string) => void;
  onRemoveReceipt: () => void;
}

export const ReceiptAttachmentArea: React.FC<ReceiptAttachmentAreaProps> = ({
  receiptName,
  onAttachReceipt,
  onRemoveReceipt,
}) => {
  const handleSimulateAttachment = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const mockReceipt = `receipt_${timestamp}_${Math.floor(Math.random() * 900 + 100)}.pdf`;
    onAttachReceipt(mockReceipt);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Receipt Attachment</Text>

      {receiptName ? (
        <View style={styles.attachedCard}>
          <View style={styles.left}>
            <View style={styles.checkIcon}>
              <FileCheck size={18} color="#059669" />
            </View>
            <View>
              <Text style={styles.fileName}>{receiptName}</Text>
              <Text style={styles.fileSize}>Attached to local record</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onRemoveReceipt}
            style={styles.removeBtn}
            accessibilityRole="button"
            accessibilityLabel="Remove receipt attachment"
          >
            <X size={16} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handleSimulateAttachment}
          style={styles.dropZone}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Attach receipt document or photo"
        >
          <View style={styles.iconCircle}>
            <Camera size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.mainPrompt}>Attach Invoice or Receipt</Text>
          <Text style={styles.subPrompt}>Tap to add photo or PDF document</Text>
        </TouchableOpacity>
      )}
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
  dropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F8FAFC',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mainPrompt: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subPrompt: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  attachedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: theme.borderRadius.md,
    padding: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  fileSize: {
    fontSize: 11,
    color: '#059669',
    marginTop: 1,
  },
  removeBtn: {
    padding: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
});
