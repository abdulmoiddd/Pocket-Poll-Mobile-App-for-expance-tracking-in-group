import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { theme } from '../../theme';
import { SpendingTrendPoint } from '../../types';

interface InsightLineChartProps {
  trendData: SpendingTrendPoint[];
  currencySymbol: string;
}

const screenWidth = Dimensions.get('window').width;

export const InsightLineChart: React.FC<InsightLineChartProps> = ({
  trendData,
  currencySymbol,
}) => {
  const chartWidth = screenWidth - 72;
  const chartHeight = 150;
  const paddingBottom = 26;
  const paddingTop = 16;

  const amounts = trendData.map((d) => d.amount);
  const maxAmount = Math.max(...amounts, 80);

  const points = trendData.map((d, index) => {
    const x =
      trendData.length > 1
        ? (index / (trendData.length - 1)) * (chartWidth - 24) + 12
        : chartWidth / 2;
    const y =
      chartHeight -
      paddingBottom -
      (d.amount / maxAmount) * (chartHeight - paddingBottom - paddingTop);
    return { x, y, amount: d.amount, label: d.label };
  });

  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      linePath += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }
  }

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`
      : '';

  return (
    <View style={styles.card} accessibilityRole="image" accessibilityLabel="Spending Trends Chart">
      <View style={styles.header}>
        <Text style={styles.title}>Spending Flow Over Time</Text>
        <Text style={styles.subtitle}>Daily Outflow Distribution</Text>
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="insightGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#7B66FF" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#5A48D6" stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Horizontal grid lines */}
        <Line
          x1="0"
          y1={chartHeight - paddingBottom}
          x2={chartWidth}
          y2={chartHeight - paddingBottom}
          stroke="#E2E8F0"
          strokeWidth="1"
        />
        <Line
          x1="0"
          y1={(chartHeight - paddingBottom) / 2}
          x2={chartWidth}
          y2={(chartHeight - paddingBottom) / 2}
          stroke="#F1F5F9"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {areaPath ? <Path d={areaPath} fill="url(#insightGradient)" /> : null}

        {linePath ? (
          <Path
            d={linePath}
            fill="none"
            stroke="#5A48D6"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {points.map((pt, idx) => (
          <Circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r="5"
            fill="#FFFFFF"
            stroke="#5A48D6"
            strokeWidth="3"
          />
        ))}
      </Svg>

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
  header: {
    marginBottom: 12,
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
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  dayLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
});
