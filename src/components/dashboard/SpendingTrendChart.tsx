import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { theme } from '../../theme';
import { SpendingTrendPoint } from '../../types';
import { formatCurrency } from '../../services/calculations';

interface SpendingTrendChartProps {
  trendData: SpendingTrendPoint[];
  currencySymbol: string;
}

const screenWidth = Dimensions.get('window').width;

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  trendData,
  currencySymbol,
}) => {
  const chartWidth = screenWidth - 72; // Padding
  const chartHeight = 120;
  const paddingBottom = 24;
  const paddingTop = 12;

  const amounts = trendData.map((d) => d.amount);
  const maxAmount = Math.max(...amounts, 50);
  const totalWeekly = amounts.reduce((a, b) => a + b, 0);

  // Compute points
  const points = trendData.map((d, index) => {
    const x =
      trendData.length > 1
        ? (index / (trendData.length - 1)) * (chartWidth - 20) + 10
        : chartWidth / 2;
    const y =
      chartHeight -
      paddingBottom -
      (d.amount / maxAmount) * (chartHeight - paddingBottom - paddingTop);
    return { x, y, amount: d.amount, label: d.label };
  });

  // Construct SVG path for line
  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Smooth curve with bezier control points
      const prev = points[i - 1];
      const curr = points[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      linePath += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }
  }

  // Construct area path
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`
      : '';

  return (
    <View
      style={styles.container}
      accessibilityRole="image"
      accessibilityLabel={`7-Day Spending Trend chart. Total spent in last 7 days: ${formatCurrency(totalWeekly, currencySymbol)}`}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Spending Trend</Text>
          <Text style={styles.subtitle}>Past 7 Days Activity</Text>
        </View>
        <Text style={styles.totalBadge}>
          {formatCurrency(totalWeekly, currencySymbol)}
        </Text>
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#7B66FF" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#5A48D6" stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        <Line
          x1="0"
          y1={chartHeight - paddingBottom}
          x2={chartWidth}
          y2={chartHeight - paddingBottom}
          stroke="#E2E8F0"
          strokeWidth="1"
        />

        {/* Area fill */}
        {areaPath ? <Path d={areaPath} fill="url(#trendGradient)" /> : null}

        {/* Trend line */}
        {linePath ? (
          <Path
            d={linePath}
            fill="none"
            stroke="#6C56F0"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Data points */}
        {points.map((pt, idx) => (
          <React.Fragment key={idx}>
            <Circle
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill="#FFFFFF"
              stroke="#5A48D6"
              strokeWidth="2.5"
            />
          </React.Fragment>
        ))}
      </Svg>

      {/* Day Labels */}
      <View style={styles.labelsRow}>
        {points.map((pt, idx) => (
          <Text key={idx} style={styles.dayLabel}>
            {pt.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  totalBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 2,
  },
  dayLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
});
