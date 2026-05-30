// Powered by OnSpace.AI
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { usePortfolio } from '@/hooks/usePortfolio';
import { fetchSnapshotQuote, fetchAggregates, fetchStockDetails, StockQuote, AggBar, StockDetails } from '@/services/polygon';
import { OrderModal } from '@/components/feature/OrderModal';
import { Badge } from '@/components/ui/Badge';

type ChartRange = '1D' | '1W' | '1M' | '3M' | '1Y';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StockDetailScreen() {
  const { symbol, name: nameParam } = useLocalSearchParams<{ symbol: string; name?: string }>();
  const navigation = useNavigation();
  const { apiKey, portfolio, addToWatchlist, removeFromWatchlist, isInWatchlist, updatePositionPrice } = usePortfolio();

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [details, setDetails] = useState<StockDetails | null>(null);
  const [chartData, setChartData] = useState<AggBar[]>([]);
  const [range, setRange] = useState<ChartRange>('1M');
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const inWatchlist = isInWatchlist(symbol);
  const position = portfolio.positions.find(p => p.symbol === symbol);

  const toggleWatchlist = useCallback(() => {
    if (inWatchlist) removeFromWatchlist(symbol);
    else addToWatchlist({ symbol, name: details?.name ?? nameParam ?? symbol });
  }, [inWatchlist, symbol, details, nameParam, addToWatchlist, removeFromWatchlist]);

  const loadQuote = useCallback(async () => {
    if (!apiKey) return;
    setIsLoadingQuote(true);
    try {
      const q = await fetchSnapshotQuote(symbol, apiKey);
      if (q) {
        setQuote(q);
        updatePositionPrice(symbol, q.price);
      }
    } finally {
      setIsLoadingQuote(false);
    }
  }, [apiKey, symbol, updatePositionPrice]);

  const loadChart = useCallback(async (r: ChartRange) => {
    if (!apiKey) return;
    setIsLoadingChart(true);
    try {
      const today = new Date();
      const toStr = today.toISOString().split('T')[0];
      let fromDate = new Date(today);
      let multiplier = 1;
      let timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day';

      if (r === '1D') { fromDate.setDate(today.getDate() - 1); multiplier = 5; timespan = 'minute'; }
      else if (r === '1W') { fromDate.setDate(today.getDate() - 7); multiplier = 1; timespan = 'hour'; }
      else if (r === '1M') { fromDate.setMonth(today.getMonth() - 1); multiplier = 1; timespan = 'day'; }
      else if (r === '3M') { fromDate.setMonth(today.getMonth() - 3); multiplier = 1; timespan = 'day'; }
      else if (r === '1Y') { fromDate.setFullYear(today.getFullYear() - 1); multiplier = 1; timespan = 'week'; }

      const fromStr = fromDate.toISOString().split('T')[0];
      const bars = await fetchAggregates(symbol, apiKey, multiplier, timespan, fromStr, toStr);
      setChartData(bars);
    } finally {
      setIsLoadingChart(false);
    }
  }, [apiKey, symbol]);

  const loadDetails = useCallback(async () => {
    if (!apiKey) return;
    const d = await fetchStockDetails(symbol, apiKey);
    if (d) setDetails(d);
  }, [apiKey, symbol]);

  useEffect(() => {
    navigation.setOptions({ title: symbol });
    loadQuote();
    loadDetails();
    loadChart(range);
  }, [symbol]);

  const handleRangeChange = (r: ChartRange) => {
    setRange(r);
    loadChart(r);
  };

  const isGain = (quote?.changePercent ?? 0) >= 0;
  const chartColor = isGain ? Colors.gain : Colors.loss;
  const chartPrices = chartData.map(d => d.close);
  const chartMin = chartPrices.length > 0 ? Math.min(...chartPrices) * 0.998 : 0;
  const chartMax = chartPrices.length > 0 ? Math.max(...chartPrices) * 1.002 : 1;
  const displayName = details?.name ?? nameParam ?? symbol;

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Quote Header */}
        <View style={styles.quoteHeader}>
          <View style={styles.quoteLeft}>
            <Text style={styles.stockName} numberOfLines={2}>{displayName}</Text>
            {isLoadingQuote ? (
              <ActivityIndicator color={Colors.primary} size="small" style={{ marginTop: 8 }} />
            ) : (
              <>
                <Text style={styles.priceHero}>${quote?.price.toFixed(2) ?? '—'}</Text>
                <View style={styles.changeRow}>
                  <Text style={[styles.changeText, { color: isGain ? Colors.gain : Colors.loss }]}>
                    {isGain ? '+' : ''}{quote?.change.toFixed(2) ?? '0'}
                  </Text>
                  <Badge
                    value={quote?.changePercent ?? 0}
                    type={isGain ? 'gain' : 'loss'}
                    showSign
                    suffix="%"
                    size="sm"
                  />
                </View>
              </>
            )}
          </View>
          <Pressable onPress={toggleWatchlist} hitSlop={8} style={styles.watchlistBtn}>
            <Ionicons
              name={inWatchlist ? 'star' : 'star-outline'}
              size={24}
              color={inWatchlist ? Colors.warning : Colors.textMuted}
            />
          </Pressable>
        </View>

        {/* Current Position Info */}
        {position && (
          <View style={styles.positionBanner}>
            <Ionicons name="briefcase-outline" size={14} color={Colors.primary} />
            <Text style={styles.positionText}>
              You hold {position.shares} shares · Avg ${position.avgCost.toFixed(2)} ·{' '}
              <Text style={{ color: (position.currentPrice - position.avgCost) >= 0 ? Colors.gain : Colors.loss }}>
                {(position.currentPrice - position.avgCost) >= 0 ? '+' : ''}
                ${((position.currentPrice - position.avgCost) * position.shares).toFixed(2)} P&L
              </Text>
            </Text>
          </View>
        )}

        {/* Chart */}
        <View style={styles.chartContainer}>
          {/* Range Selector */}
          <View style={styles.rangeRow}>
            {(['1D', '1W', '1M', '3M', '1Y'] as ChartRange[]).map(r => (
              <Pressable key={r} onPress={() => handleRangeChange(r)} style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}>
                <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r}</Text>
              </Pressable>
            ))}
          </View>

          {isLoadingChart ? (
            <View style={[styles.chartPlaceholder, { height: 200 }]}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : chartPrices.length > 1 ? (
            <LineChart
              data={{ labels: [], datasets: [{ data: chartPrices }] }}
              width={SCREEN_WIDTH - 32}
              height={200}
              withDots={false}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLabels={false}
              withHorizontalLabels={true}
              fromZero={false}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: Colors.surface,
                backgroundGradientTo: Colors.surface,
                decimalPlaces: 2,
                color: () => chartColor,
                labelColor: () => Colors.textMuted,
                propsForBackgroundLines: { stroke: Colors.chartGrid, strokeWidth: 0.5 },
                propsForHorizontalLabels: { fontSize: 10 },
              }}
              yAxisLabel="$"
              yAxisSuffix=""
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.chartPlaceholder}>
              <Text style={styles.noChartText}>No chart data available</Text>
            </View>
          )}
        </View>

        {/* Key Stats */}
        {quote && (
          <View style={styles.statsGrid}>
            <Text style={styles.sectionTitle}>Key Statistics</Text>
            <View style={styles.statsRow}>
              {[
                { label: 'Open', value: `$${quote.open.toFixed(2)}` },
                { label: 'Prev Close', value: `$${quote.previousClose.toFixed(2)}` },
                { label: '52W High', value: `$${quote.high.toFixed(2)}` },
                { label: '52W Low', value: `$${quote.low.toFixed(2)}` },
                { label: 'Volume', value: quote.volume > 1000000 ? `${(quote.volume / 1000000).toFixed(1)}M` : `${(quote.volume / 1000).toFixed(0)}K` },
                { label: 'Change %', value: `${quote.changePercent.toFixed(2)}%` },
              ].map(stat => (
                <View key={stat.label} style={styles.statCell}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* About */}
        {details?.description && (
          <View style={styles.aboutCard}>
            <Text style={styles.sectionTitle}>About</Text>
            {details.industry && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Industry</Text>
                <Text style={styles.detailValue}>{details.industry}</Text>
              </View>
            )}
            {details.exchange && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Exchange</Text>
                <Text style={styles.detailValue}>{details.exchange}</Text>
              </View>
            )}
            {details.marketCap && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Market Cap</Text>
                <Text style={styles.detailValue}>${(details.marketCap / 1e9).toFixed(2)}B</Text>
              </View>
            )}
            {details.employees && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Employees</Text>
                <Text style={styles.detailValue}>{details.employees.toLocaleString()}</Text>
              </View>
            )}
            <Text style={styles.description} numberOfLines={5}>{details.description}</Text>
          </View>
        )}
      </ScrollView>

      {/* Trade Buttons */}
      <View style={styles.tradeBar}>
        <Pressable
          onPress={() => setOrderModalVisible(true)}
          style={({ pressed }) => [styles.tradeBtn, { backgroundColor: Colors.gain }, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="arrow-down-circle-outline" size={18} color="#fff" />
          <Text style={styles.tradeBtnText}>BUY</Text>
        </Pressable>
        {position && (
          <Pressable
            onPress={() => setOrderModalVisible(true)}
            style={({ pressed }) => [styles.tradeBtn, { backgroundColor: Colors.loss }, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="arrow-up-circle-outline" size={18} color="#fff" />
            <Text style={styles.tradeBtnText}>SELL</Text>
          </Pressable>
        )}
      </View>

      <OrderModal
        visible={orderModalVisible}
        onClose={() => setOrderModalVisible(false)}
        symbol={symbol}
        name={displayName}
        quote={quote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  quoteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  quoteLeft: { flex: 1 },
  stockName: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, includeFontPadding: false },
  priceHero: { fontSize: 38, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, includeFontPadding: false },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  changeText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, includeFontPadding: false },
  watchlistBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder },
  positionBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.primaryDim, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary },
  positionText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, includeFontPadding: false },
  chartContainer: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.surfaceBorder, ...Shadow.card },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  rangeBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.sm },
  rangeBtnActive: { backgroundColor: Colors.primaryDim },
  rangeText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted, includeFontPadding: false },
  rangeTextActive: { color: Colors.primary },
  chart: { borderRadius: BorderRadius.md, marginLeft: -16 },
  chartPlaceholder: { height: 200, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md },
  noChartText: { color: Colors.textMuted, fontSize: FontSize.sm, includeFontPadding: false },
  statsGrid: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md, includeFontPadding: false },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden' },
  statCell: { width: '33.33%', padding: Spacing.md, borderRightWidth: 1, borderBottomWidth: 1, borderColor: Colors.surfaceBorder },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, includeFontPadding: false },
  statValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  aboutCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.surfaceBorder },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  detailLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, includeFontPadding: false },
  detailValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, includeFontPadding: false },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginTop: Spacing.md, includeFontPadding: false },
  tradeBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, paddingBottom: 32, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  tradeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 15, borderRadius: BorderRadius.lg },
  tradeBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#fff', includeFontPadding: false },
});
