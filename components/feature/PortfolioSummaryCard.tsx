// Powered by OnSpace.AI
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { usePortfolio } from '@/hooks/usePortfolio';
import { LinearGradient } from 'expo-linear-gradient';

export const PortfolioSummaryCard = memo(function PortfolioSummaryCard() {
  const { totalPortfolioValue, totalGainLoss, totalGainLossPercent, portfolio } = usePortfolio();
  const isGain = totalGainLoss >= 0;
  const positionsValue = portfolio.positions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);

  return (
    <LinearGradient
      colors={isGain ? ['#0a2018', '#0D1117'] : ['#200a0a', '#0D1117']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <Text style={styles.label}>Portfolio Value</Text>
        <View style={[styles.badge, { backgroundColor: isGain ? Colors.gainBg : Colors.lossBg }]}>
          <Text style={[styles.badgeText, { color: isGain ? Colors.gain : Colors.loss }]}>
            {isGain ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
          </Text>
        </View>
      </View>
      <Text style={styles.totalValue}>${totalPortfolioValue.toFixed(2)}</Text>
      <Text style={[styles.gainLoss, { color: isGain ? Colors.gain : Colors.loss }]}>
        {isGain ? '+' : ''}${totalGainLoss.toFixed(2)} all time
      </Text>
      <View style={styles.divider} />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Cash</Text>
          <Text style={styles.statValue}>${portfolio.cash.toFixed(2)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Invested</Text>
          <Text style={styles.statValue}>${positionsValue.toFixed(2)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Positions</Text>
          <Text style={styles.statValue}>{portfolio.positions.length}</Text>
        </View>
      </View>
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadow.elevated,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    includeFontPadding: false,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    includeFontPadding: false,
  },
  gainLoss: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    includeFontPadding: false,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
    includeFontPadding: false,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.surfaceBorder },
});
