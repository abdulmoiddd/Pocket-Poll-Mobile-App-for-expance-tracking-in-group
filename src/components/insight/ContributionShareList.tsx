import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { MemberContributionSummary } from '../../types';
import { formatCurrency } from '../../services/calculations';

interface ContributionShareListProps {
  memberSummaries: MemberContributionSummary[];
  currencySymbol: string;
}

export const ContributionShareList: React.FC<ContributionShareListProps> = ({
  memberSummaries,
  currencySymbol,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Member Pool Share</Text>
        <Text style={styles.subtitle}>Who funded the pool</Text>
      </View>

      {memberSummaries.length === 0 ? (
        <Text style={styles.emptyText}>No contributions recorded yet.</Text>
      ) : (
        <View style={styles.list}>
          {memberSummaries.map((m) => {
            const initials = m.memberName
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <View
                key={m.memberId}
                style={styles.item}
                accessibilityRole="text"
                accessibilityLabel={`${m.memberName}: ${formatCurrency(
                  m.totalContributed,
                  currencySymbol
                )}, ${m.percentageOfPool}% of the pool, from ${m.contributionCount} contributions`}
              >
                <View style={styles.topRow}>
                  <View style={styles.left}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: m.avatarColor || theme.colors.primary },
                      ]}
                    >
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View>
                      <Text style={styles.name}>{m.memberName}</Text>
                      <Text style={styles.countText}>
                        {m.contributionCount} {m.contributionCount === 1 ? 'deposit' : 'deposits'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.right}>
                    <Text style={styles.amount}>
                      {formatCurrency(m.totalContributed, currencySymbol)}
                    </Text>
                    <Text style={styles.percentText}>{m.percentageOfPool}%</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.min(100, Math.max(2, m.percentageOfPool))}%`,
                        backgroundColor: m.avatarColor || theme.colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
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
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    ...theme.shadows.sm,
  },
  header: {
    marginBottom: 14,
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
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  list: {
    gap: 14,
  },
  item: {
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  countText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  percentText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  track: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
