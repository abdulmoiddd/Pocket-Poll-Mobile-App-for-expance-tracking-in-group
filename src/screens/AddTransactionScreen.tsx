import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { usePocketPool } from '../context/PocketPoolContext';
import { Header } from '../components/common/Header';
import { CategoryGrid } from '../components/transaction/CategoryGrid';
import { MemberSelector } from '../components/transaction/MemberSelector';
import { PaymentMethodSelector } from '../components/transaction/PaymentMethodSelector';
import { ReceiptAttachmentArea } from '../components/transaction/ReceiptAttachmentArea';
import { Button } from '../components/common/Button';
import { theme } from '../theme';
import { TransactionType, ExpenseCategory, PaymentMethod } from '../types';
import { Check, X } from 'lucide-react-native';

interface AddTransactionScreenProps {
  initialType?: TransactionType;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({
  initialType = 'expense',
  onSuccess,
  onCancel,
}) => {
  const { members, settings, addTransaction, addMember } = usePocketPool();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amountStr, setAmountStr] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('Food');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    members.length > 0 ? members[0].id : ''
  );
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('Credit Card');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [receiptName, setReceiptName] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const numericAmount = parseFloat(amountStr);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than zero.');
      return;
    }

    const member = members.find((m) => m.id === selectedMemberId) || members[0];
    if (!member) {
      Alert.alert('Member Required', 'Please select or add a member.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        type,
        amount: numericAmount,
        memberId: member.id,
        memberName: member.name,
        category: type === 'expense' ? selectedCategory : undefined,
        date,
        paymentMethod: selectedPayment,
        notes: notes.trim() || (type === 'contribution' ? 'Pool Contribution' : selectedCategory),
        receiptName,
      });

      Alert.alert(
        'Transaction Recorded',
        type === 'contribution'
          ? `Added ${settings.currencySymbol}${numericAmount.toFixed(
              2
            )} deposit to pool from ${member.name}.`
          : `Recorded ${settings.currencySymbol}${numericAmount.toFixed(
              2
            )} expense for ${selectedCategory}.`,
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Purple Gradient Header per requirements */}
        <Header
          title={type === 'expense' ? 'Record Expense' : 'Add Contribution'}
          subtitle="Pool Financial Entry"
          variant="purple"
          showLogo={false}
          rightAction={
            <TouchableOpacity
              onPress={onCancel}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel and close"
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          }
        >
          {/* Segmented Type Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              onPress={() => setType('expense')}
              style={[styles.typeOption, type === 'expense' && styles.selectedTypeOption]}
              accessibilityRole="button"
              accessibilityLabel="Expense entry"
            >
              <Text
                style={[
                  styles.typeOptionText,
                  type === 'expense' && styles.selectedTypeOptionText,
                ]}
              >
                Expense (-)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setType('contribution')}
              style={[styles.typeOption, type === 'contribution' && styles.selectedTypeOption]}
              accessibilityRole="button"
              accessibilityLabel="Contribution deposit entry"
            >
              <Text
                style={[
                  styles.typeOptionText,
                  type === 'contribution' && styles.selectedTypeOptionText,
                ]}
              >
                Deposit (+)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Massive Input Metric for Amount per requirements */}
          <View style={styles.massiveAmountContainer}>
            <Text style={styles.currencySymbol}>{settings.currencySymbol}</Text>
            <TextInput
              style={styles.massiveAmountInput}
              placeholder="0.00"
              placeholderTextColor="rgba(255, 255, 255, 0.45)"
              keyboardType="decimal-pad"
              value={amountStr}
              onChangeText={setAmountStr}
              autoFocus
              accessibilityLabel="Transaction amount input"
            />
          </View>
        </Header>

        {/* Main White Container */}
        <View style={styles.whiteContainer}>
          {/* If Expense: 3x2 Category Grid */}
          {type === 'expense' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Category</Text>
              <CategoryGrid
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </View>
          ) : null}

          {/* Member Selector */}
          <MemberSelector
            members={members}
            selectedMemberId={selectedMemberId}
            onSelectMember={setSelectedMemberId}
            onAddNewMember={async (name) => {
              const newM = await addMember(name);
              setSelectedMemberId(newM.id);
            }}
            label={type === 'expense' ? 'Paid by Member' : 'Deposited by Member'}
          />

          {/* Date Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Date</Text>
            <TextInput
              style={styles.inputField}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          {/* Payment Method Selector */}
          <PaymentMethodSelector
            selectedMethod={selectedPayment}
            onSelectMethod={setSelectedPayment}
          />

          {/* Notes field */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description &amp; Notes</Text>
            <TextInput
              style={[styles.inputField, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder={
                type === 'expense'
                  ? 'e.g. Seafood lunch with the team'
                  : 'e.g. Cabin deposit via wire'
              }
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Receipt Attachment Area */}
          <ReceiptAttachmentArea
            receiptName={receiptName}
            onAttachReceipt={(name) => setReceiptName(name)}
            onRemoveReceipt={() => setReceiptName(undefined)}
          />

          {/* Full-width purple submit button */}
          <Button
            title={
              type === 'expense'
                ? `Confirm Expense (-${settings.currencySymbol}${amountStr || '0.00'})`
                : `Confirm Deposit (+${settings.currencySymbol}${amountStr || '0.00'})`
            }
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!amountStr || parseFloat(amountStr) <= 0}
            size="lg"
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: theme.borderRadius.full,
    padding: 4,
    marginVertical: 12,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
  },
  selectedTypeOption: {
    backgroundColor: '#FFFFFF',
  },
  typeOptionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  selectedTypeOptionText: {
    color: theme.colors.primary,
  },
  massiveAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 6,
  },
  massiveAmountInput: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 160,
    textAlign: 'center',
  },
  whiteContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.borderRadius.full,
    borderTopRightRadius: theme.borderRadius.full,
    marginTop: -16,
    padding: 22,
    ...theme.shadows.md,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputField: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    fontSize: 15,
    color: theme.colors.textPrimary,
    backgroundColor: '#F8FAFC',
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 20,
    marginBottom: 10,
  },
});
