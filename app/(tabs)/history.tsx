// Powered by OnSpace.AI
import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Trade } from '@/services/storage';

type Filter = 'ALL' | 'BUY' | 'SELL' | 'PENDING';

export default function HistoryScreen() {
  const { portfolio, cancelOrder } = usePortfolio();
  const [filter, setFilter] = useState<Filter>('ALL');

  const trades = useMemo(() => {
    if (filter === 'ALL') return portfolio.trades;
    if (filter === 'PENDING') return portfolio.pendingOrders.map(o => ({
      id: o.id, symbol: o.symbol, name: o.name, type: o.type,
      orderType: o.orderType, shares: o.shares, price: o.targetPrice,
      total: o.shares * o.targetPrice, timestamp: o.createdAt, status: 'PENDING' as const,
    }));
    return portfolio.trades.filter(t => t.type === filter);
  }, [portfolio.trades, portfolio.pendingOrders, filter]);

  const totalTrades = portfolio.trades.length;
  const buyCount = portfolio.trades.filter(t => t.type === 'BUY' && t.status === 'FILLED').length;
  const sellCount = portfolio.trades.filter(t => t.type === 'SELL' && t.status === 'FILLED').length;
  const filledVolume = portfolio.trades.filter(t => t.status === 'FILLED').reduce((sum, t) => sum + t.total, 0);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderTrade = ({ item }: { item: Trade | any }) => {
    const isBuy = item.type === 'BUY';
    const isPending = item.status === 'PENDING';
    const isCancelled = item.status === 'CANCELLED';

    const statusColor = isCancelled ? Colors.textMuted
      : isPending ? Colors.warning
      : isBuy ? Colors.gain : Colors.loss;

    return (
      <View style={[styles.tradeCard, isCancelled && styles.tradeCardCancelled]}>
        <View style={styles.tradeHeader}>
          <View style={styles.tradeLeft}>
            <View style={[styles.typeBadge, { backgroundColor: isBuy ? Colors.gainBg : Colors.lossBg }]}>
              <Ionicons
                name={isBuy ? 'arrow-down-circle' : 'arrow-up-circle'}
                size={14}
                color={isBuy ? Colors.gain : Colors.loss}
              />
              <Text style={[styles.typeText, { color: isBuy ? Colors.gain : Colors.loss }]}>{item.type}</Text>
            </View>
            <View style={styles.tradeInfo}>
              <Text style={styles.tradeSymbol}>{item.symbol}</Text>
              <Text style={styles.tradeName} numberOfLines={1}>{item.name}</Text>
            </View>
          </View>
          <View style={styles.tradeRight}>
            <Text style={styles.tradeTotal}>${item.total.toFixed(2)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: isPending ? Colors.warningBg : isCancelled ? Colors.surfaceBorder : isBuy ? Colors.gainBg : Colors.lossBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            </View>
          </View>
        </View>
        <View style={styles.tradeDetails}>
          <Text style={styles.tradeDetailText}>{item.shares} shares @ ${item.price.toFixed(2)}</Text>
          <Text style={styles.tradeDetailText}>·</Text>
          <Text style={styles.tradeDetailText}>{item.orderType?.replace('_', ' ')}</Text>
          <Text style={styles.tradeDetailText}>·</Text>
          <Text style={styles.tradeDetailText}>{formatTime(item.timestamp)}</Text>
        </View>
        {isPending && (
          <Pressable
            onPress={() => cancelOrder(item.id)}
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const filters: Filter[] = ['ALL', 'BUY', 'SELL', 'PENDING'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Trade History</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalTrades}</Text>
          <Text style={styles.statLabel}>Total Trades</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.gain }]}>{buyCount}</Text>
          <Text style={styles.statLabel}>Buys</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.loss }]}>{sellCount}</Text>
          <Text style={styles.statLabel}>Sells</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${(filledVolume / 1000).toFixed(1)}K</Text>
          <Text style={styles.statLabel}>Volume</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map(f => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={trades}
        keyExtractor={item => item.id}
        renderItem={renderTrade}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Trades Yet</Text>
            <Text style={styles.emptySub}>Your executed and pending orders will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, includeFontPadding: false },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, includeFontPadding: false },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  filterBtn: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  filterBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, includeFontPadding: false },
  filterTextActive: { color: Colors.primary },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 24 },
  tradeCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder, ...Shadow.card },
  tradeCardCancelled: { opacity: 0.5 },
  tradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  tradeLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.sm, marginRight: Spacing.md },
  typeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, includeFontPadding: false },
  tradeInfo: { flex: 1 },
  tradeSymbol: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  tradeName: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, includeFontPadding: false },
  tradeRight: { alignItems: 'flex-end' },
  tradeTotal: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm, marginTop: 4 },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, includeFontPadding: false },
  tradeDetails: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  tradeDetailText: { fontSize: FontSize.xs, color: Colors.textMuted, includeFontPadding: false },
  cancelBtn: { marginTop: Spacing.sm, backgroundColor: Colors.lossBg, borderRadius: BorderRadius.sm, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.loss },
  cancelBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.loss, includeFontPadding: false },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  emptySub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', includeFontPadding: false },
});
