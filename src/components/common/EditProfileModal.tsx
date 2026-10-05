import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../store/AuthContext';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [prevVisible, setPrevVisible] = useState(visible);
  const [isSaving, setIsSaving] = useState(false);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible && user) {
      setName(user.name);
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    await updateProfile(name.trim(), user?.profileImage);
    setIsSaving(false);
    onClose();
  };

  const initialLetter = (name.trim() || user?.name || 'A').charAt(0).toUpperCase();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Profile Photo or Name Initial */}
            <View style={styles.avatarPreviewSection}>
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatarPreview} />
              ) : (
                <View style={styles.initialBox}>
                  <Text style={styles.initialText}>{initialLetter}</Text>
                </View>
              )}
              {user?.email && (
                <View style={styles.googleAccountBadge}>
                  <Ionicons name="logo-google" size={13} color="#EA4335" />
                  <Text style={styles.googleEmailText}>{user.email}</Text>
                </View>
              )}
            </View>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={Colors.dark.textMuted}
                autoCorrect={false}
              />
            </View>

            {/* Save Button */}
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                (!name.trim() || isSaving) && styles.saveButtonDisabled,
              ]}
              disabled={!name.trim() || isSaving}
              onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0B1020',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '65%',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  avatarPreviewSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarPreview: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: Colors.dark.primary,
  },
  initialBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 2.5,
    borderColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  initialText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  googleAccountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  googleEmailText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
