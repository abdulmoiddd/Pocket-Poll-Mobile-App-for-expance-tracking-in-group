import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme';
import { SAMPLE_RECEIPT_IMAGE_URI } from '../../services/receiptSamples';
import {
  Camera,
  Image as ImageIcon,
  Paperclip,
  X,
  FileCheck,
  Eye,
  Sparkles,
} from 'lucide-react-native';

interface ReceiptAttachmentAreaProps {
  receiptUri?: string;
  receiptName?: string;
  onAttachReceipt: (uri: string, name: string) => void;
  onRemoveReceipt: () => void;
}

export const ReceiptAttachmentArea: React.FC<ReceiptAttachmentAreaProps> = ({
  receiptUri,
  receiptName,
  onAttachReceipt,
  onRemoveReceipt,
}) => {
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  const handlePickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access in your device settings to photograph receipts.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName =
          asset.fileName || `receipt_photo_${Date.now().toString().slice(-6)}.jpg`;
        onAttachReceipt(asset.uri, fileName);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err?.message || 'Could not launch camera.');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Access Required',
          'Please allow photo library access in your settings to select receipt pictures.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName =
          asset.fileName || `receipt_img_${Date.now().toString().slice(-6)}.jpg`;
        onAttachReceipt(asset.uri, fileName);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err?.message || 'Could not select photo.');
    }
  };

  const handleAttachSample = () => {
    onAttachReceipt(
      SAMPLE_RECEIPT_IMAGE_URI,
      `sample_receipt_${new Date().toISOString().slice(0, 10)}.png`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Receipt Picture &amp; Attachment</Text>

      {receiptUri ? (
        <View style={styles.attachedCard}>
          <TouchableOpacity
            onPress={() => setPreviewModalVisible(true)}
            style={styles.thumbnailWrapper}
            accessibilityRole="button"
            accessibilityLabel="Preview attached receipt picture"
          >
            <Image source={{ uri: receiptUri }} style={styles.thumbnail} resizeMode="cover" />
            <View style={styles.zoomOverlay}>
              <Eye size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.attachedDetails}>
            <View style={styles.attachedTitleRow}>
              <FileCheck size={16} color="#059669" />
              <Text style={styles.fileName} numberOfLines={1}>
                {receiptName || 'Receipt Attached'}
              </Text>
            </View>
            <Text style={styles.fileSize}>Picture saved with expense details</Text>

            <TouchableOpacity
              onPress={() => setPreviewModalVisible(true)}
              style={styles.viewLink}
            >
              <Text style={styles.viewLinkText}>Tap to view full receipt</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onRemoveReceipt}
            style={styles.removeBtn}
            accessibilityRole="button"
            accessibilityLabel="Remove receipt photo"
          >
            <X size={16} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.optionsBox}>
          <Text style={styles.promptText}>
            Attach receipt in picture form to verify and audit this expense:
          </Text>

          <View style={styles.buttonGrid}>
            <TouchableOpacity
              onPress={handlePickFromCamera}
              style={styles.optionBtn}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Take receipt photo with camera"
            >
              <View style={[styles.btnIconCircle, { backgroundColor: theme.colors.primaryLight }]}>
                <Camera size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.btnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePickFromGallery}
              style={styles.optionBtn}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Choose receipt picture from gallery"
            >
              <View style={[styles.btnIconCircle, { backgroundColor: '#DBEAFE' }]}>
                <ImageIcon size={18} color="#2563EB" />
              </View>
              <Text style={styles.btnText}>Choose Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAttachSample}
              style={styles.optionBtn}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Attach sample receipt"
            >
              <View style={[styles.btnIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Sparkles size={18} color="#059669" />
              </View>
              <Text style={styles.btnText}>Demo Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Fullscreen Receipt Viewer Modal */}
      <Modal
        visible={previewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.viewerOverlay}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerTitle}>{receiptName || 'Receipt Photo'}</Text>
            <TouchableOpacity
              onPress={() => setPreviewModalVisible(false)}
              style={styles.viewerCloseBtn}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {receiptUri ? (
            <View style={styles.viewerImageWrapper}>
              <Image
                source={{ uri: receiptUri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() => setPreviewModalVisible(false)}
            style={styles.viewerDoneBtn}
          >
            <Text style={styles.viewerDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  attachedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    gap: 12,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  zoomOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 2,
  },
  attachedDetails: {
    flex: 1,
  },
  attachedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    maxWidth: 180,
  },
  fileSize: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
  },
  viewLink: {
    marginTop: 4,
  },
  viewLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  removeBtn: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  optionsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    padding: 14,
  },
  promptText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  btnIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewerCloseBtn: {
    padding: 8,
  },
  viewerImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  viewerDoneBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  viewerDoneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
