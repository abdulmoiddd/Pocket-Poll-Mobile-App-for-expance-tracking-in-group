import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { theme } from '../../theme';
import { ExportFormat, ExportTimeframe } from '../../types';
import { FileText, FileSpreadsheet, Download, CheckCircle } from 'lucide-react-native';

interface ExportManagerProps {
  onExport: (format: ExportFormat, timeframe: ExportTimeframe) => Promise<any>;
}

export const ExportManager: React.FC<ExportManagerProps> = ({ onExport }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [selectedTimeframe, setSelectedTimeframe] = useState<ExportTimeframe>('last_week');
  const [isExporting, setIsExporting] = useState(false);
  const [lastExported, setLastExported] = useState<string | null>(null);

  const TIMEFRAMES: { id: ExportTimeframe; label: string; desc: string }[] = [
    { id: 'single', label: 'Single Transaction', desc: 'Latest transaction receipt' },
    { id: 'last_week', label: 'Last Week', desc: 'Past 7 days aggregated' },
    { id: 'last_month', label: 'Last Month', desc: 'Past 30 days aggregated' },
    { id: 'all_time', label: 'All-Time', desc: 'Complete historical log' },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await onExport(selectedFormat, selectedTimeframe);
      setLastExported(new Date().toLocaleTimeString());
      Alert.alert(
        'Export Generated Successfully',
        `Your ${selectedFormat.toUpperCase()} invoice for "${
          selectedTimeframe.replace('_', ' ')
        }" is ready.`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Unable to generate export.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Invoicing & Data Export</Text>
      <Text style={styles.subtitle}>
        Generate local PDF invoices and CSV reports for accounting and sharing.
      </Text>

      {/* Format Selector */}
      <Text style={styles.sectionHeader}>1. SELECT EXPORT FORMAT</Text>
      <View style={styles.formatRow}>
        <TouchableOpacity
          onPress={() => setSelectedFormat('pdf')}
          style={[
            styles.formatBtn,
            selectedFormat === 'pdf' && styles.selectedFormatBtn,
          ]}
          accessibilityRole="button"
          accessibilityLabel="PDF Invoice Format"
          accessibilityState={{ selected: selectedFormat === 'pdf' }}
        >
          <FileText
            size={20}
            color={selectedFormat === 'pdf' ? theme.colors.primary : theme.colors.textMuted}
          />
          <View>
            <Text
              style={[
                styles.formatTitle,
                selectedFormat === 'pdf' && styles.selectedFormatTitle,
              ]}
            >
              PDF Invoice
            </Text>
            <Text style={styles.formatDesc}>Executive Printable Invoice</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedFormat('csv')}
          style={[
            styles.formatBtn,
            selectedFormat === 'csv' && styles.selectedFormatBtn,
          ]}
          accessibilityRole="button"
          accessibilityLabel="CSV Spreadsheet Format"
          accessibilityState={{ selected: selectedFormat === 'csv' }}
        >
          <FileSpreadsheet
            size={20}
            color={selectedFormat === 'csv' ? '#059669' : theme.colors.textMuted}
          />
          <View>
            <Text
              style={[
                styles.formatTitle,
                selectedFormat === 'csv' && { color: '#059669' },
              ]}
            >
              CSV Spreadsheet
            </Text>
            <Text style={styles.formatDesc}>Excel & Sheets Compatible</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Timeframe Selector */}
      <Text style={styles.sectionHeader}>2. SELECT TIMEFRAME</Text>
      <View style={styles.timeframeGrid}>
        {TIMEFRAMES.map((tf) => {
          const isSelected = selectedTimeframe === tf.id;
          return (
            <TouchableOpacity
              key={tf.id}
              onPress={() => setSelectedTimeframe(tf.id)}
              style={[
                styles.timeframeCard,
                isSelected && styles.selectedTimeframeCard,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${tf.label}: ${tf.desc}, ${
                isSelected ? 'selected' : 'not selected'
              }`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.timeframeLabel,
                  isSelected && styles.selectedTimeframeLabel,
                ]}
              >
                {tf.label}
              </Text>
              <Text style={styles.timeframeDesc}>{tf.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Export Action Button */}
      <TouchableOpacity
        onPress={handleExport}
        disabled={isExporting}
        style={styles.exportBtn}
        accessibilityRole="button"
        accessibilityLabel={`Generate and Export ${selectedFormat.toUpperCase()} for ${selectedTimeframe.replace(
          '_',
          ' '
        )}`}
      >
        {isExporting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.exportContent}>
            <Download size={18} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>
              Generate &amp; Share {selectedFormat.toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {lastExported && (
        <View style={styles.lastExportRow}>
          <CheckCircle size={14} color="#059669" />
          <Text style={styles.lastExportText}>
            Last generated at {lastExported}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  formatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  selectedFormatBtn: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  formatTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  selectedFormatTitle: {
    color: theme.colors.primary,
  },
  formatDesc: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  timeframeGrid: {
    gap: 8,
    marginBottom: 18,
  },
  timeframeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  selectedTimeframeCard: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  timeframeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  selectedTimeframeLabel: {
    color: theme.colors.primary,
  },
  timeframeDesc: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  exportBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.button,
  },
  exportContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  lastExportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  lastExportText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
});
