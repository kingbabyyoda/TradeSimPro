// Powered by OnSpace.AI
import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { PortfolioSummaryCard } from '@/components/feature/PortfolioSummaryCard';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAlert } from '@/template';

export default function PortfolioScreen() {
  const router = useRouter();
  const { portfolio, totalPortfolioValue, resetAccount } = usePortfolio();
  const { showAlert } = useAlert();

  const handleReset = useCallback(() => {
    showAlert('Reset Account', 'This will wipe all trades and reset your balance to $10,000. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          await resetAccount();
          showAlert('Account Reset', 'Your account has been reset to $10,000 starting balance.');
        }
      },
    ]);
  }, [showAlert, resetAccount]);

  const renderPosition = useCallback(({ item }: any) => {
    const currentValue = item.shares * item.currentPrice;
    const costBasis = item.shares * item.avgCost;
    const pl = currentValue - costBasis;
    const plPct = costBasis > 0 ? (pl / costBasis) * 100 : 0;
    const isGain = pl >= 0;
    const allocation = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;

    return (
      <Pressable
        style={({ pressed }) => [styles.posCard, pressed && { opacity: 0.8 }]}
        onPress={() => router.push({ pathname: '/stock/[symbol]', params: { symbol: item.symbol, name: item.name } })}
      >
        <View style={styles.posHeader}>
          <View style={styles.posLeft}>
            <View style={styles.posIcon}>
              <Text style={styles.posIconText}>{item.symbol[0]}</Text>
            </View>
            <View>
              <Text style={styles.posSymbol}>{item.symbol}</Text>
              <Text style={styles.posName} numberOfLines={1}>{item.name}</Text>
            </View>
          </View>
          <View style={styles.posRight}>
            <Text style={styles.posValue}>${currentValue.toFixed(2)}</Text>
            <Text style={[styles.posPl, { color: isGain ? Colors.gain : Colors.loss }]}>
              {isGain ? '+' : ''}{pl.toFixed(2)} ({isGain ? '+' : ''}{plPct.toFixed(2)}%)
            </Text>
          </View>
        </View>
        <View style={styles.posStatsRow}>
          <View style={styles.posStat}>
            <Text style={styles.posStatLabel}>Shares</Text>
            <Text style={styles.posStatValue}>{item.shares}</Text>
          </View>
          <View style={styles.posStat}>
            <Text style={styles.posStatLabel}>Avg Cost</Text>
            <Text style={styles.posStatValue}>${item.avgCost.toFixed(2)}</Text>
          </View>
          <View style={styles.posStat}>
            <Text style={styles.posStatLabel}>Last Price</Text>
            <Text style={styles.posStatValue}>${item.currentPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.posStat}>
            <Text style={styles.posStatLabel}>Allocation</Text>
            <Text style={styles.posStatValue}>{allocation.toFixed(1)}%</Text>
          </View>
        </View>
        {/* Allocation Bar */}
        <View style={styles.allocBarBg}>
          <View style={[styles.allocBarFill, { width: `${Math.min(allocation, 100)}%`, backgroundColor: isGain ? Colors.gain : Colors.loss }]} />
        </View>
      </Pressable>
    );
  }, [router, totalPortfolioValue]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={portfolio.positions}
        keyExtractor={item => item.symbol}
        renderItem={renderPosition}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.topRow}>
              <Text style={styles.pageTitle}>Portfolio</Text>
              <Pressable onPress={handleReset} hitSlop={8} style={styles.resetBtn}>
                <Ionicons name="refresh-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            </View>
            <PortfolioSummaryCard />

            {portfolio.pendingOrders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Orders</Text>
                {portfolio.pendingOrders.map(order => (
                  <View key={order.id} style={styles.pendingCard}>
                    <View style={styles.pendingLeft}>
                      <View style={[styles.pendingBadge, { backgroundColor: order.type === 'BUY' ? Colors.gainBg : Colors.lossBg }]}>
                        <Text style={[styles.pendingBadgeText, { color: order.type === 'BUY' ? Colors.gain : Colors.loss }]}>{order.type}</Text>
                      </View>
                      <View style={{ marginLeft: Spacing.sm }}>
                        <Text style={styles.pendingSymbol}>{order.symbol}</Text>
                        <Text style={styles.pendingDetail}>{order.shares} shares · {order.orderType.replace('_', ' ')} @ ${order.targetPrice.toFixed(2)}</Text>
                      </View>
                    </View>
                    <Ionicons name="time-outline" size={16} color={Colors.warning} />
                  </View>
                ))}
              </View>
            )}

            {portfolio.positions.length > 0 && (
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginBottom: Spacing.sm }]}>Holdings</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="pie-chart-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Holdings</Text>
            <Text style={styles.emptySubtitle}>Go to Markets to buy your first stock</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.emptyBtnText}>Browse Markets</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  pageTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, includeFontPadding: false },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 6, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.surfaceBorder },
  resetText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium, includeFontPadding: false },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, includeFontPadding: false },
  pendingCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.warningBg },
  pendingLeft: { flexDirection: 'row', alignItems: 'center' },
  pendingBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.sm },
  pendingBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, includeFontPadding: false },
  pendingSymbol: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  pendingDetail: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, includeFontPadding: false },
  posCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder, ...Shadow.card },
  posHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  posLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  posIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  posIconText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary, includeFontPadding: false },
  posSymbol: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  posName: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, includeFontPadding: false },
  posRight: { alignItems: 'flex-end' },
  posValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  posPl: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: 2, includeFontPadding: false },
  posStatsRow: { flexDirection: 'row', backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  posStat: { flex: 1, alignItems: 'center' },
  posStatLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2, includeFontPadding: false },
  posStatValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, includeFontPadding: false },
  allocBarBg: { height: 3, backgroundColor: Colors.surfaceBorder, borderRadius: 2, overflow: 'hidden' },
  allocBarFill: { height: '100%', borderRadius: 2 },
  listContent: { paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md, paddingHorizontal: Spacing.lg },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  emptySubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', includeFontPadding: false },
  emptyBtn: { backgroundColor: Colors.primaryDim, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.pill, borderWidth: 1, borderColor: Colors.primary, marginTop: Spacing.sm },
  emptyBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary, includeFontPadding: false },
});
