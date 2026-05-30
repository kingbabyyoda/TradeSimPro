// Powered by OnSpace.AI
import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { StockListItem } from '@/components/feature/StockListItem';
import { usePortfolio } from '@/hooks/usePortfolio';
import { fetchBatchQuotes, StockQuote } from '@/services/polygon';

export default function WatchlistScreen() {
  const router = useRouter();
  const { portfolio, apiKey, removeFromWatchlist } = usePortfolio();
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadQuotes = useCallback(async () => {
    if (!apiKey || portfolio.watchlist.length === 0) return;
    setIsLoading(true);
    try {
      const data = await fetchBatchQuotes(portfolio.watchlist.map(w => w.symbol), apiKey);
      setQuotes(data);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, portfolio.watchlist]);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Watchlist</Text>
        <Pressable onPress={loadQuotes} hitSlop={8} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <FlatList
        data={portfolio.watchlist}
        keyExtractor={item => item.symbol}
        renderItem={({ item }) => (
          <View style={styles.itemWrapper}>
            <View style={{ flex: 1 }}>
              <StockListItem
                symbol={item.symbol}
                name={item.name}
                quote={quotes[item.symbol]}
                isLoading={isLoading}
                onPress={() => router.push({ pathname: '/stock/[symbol]' as any, params: { symbol: item.symbol, name: item.name } })}
              />
            </View>
            <Pressable
              onPress={() => removeFromWatchlist(item.symbol)}
              hitSlop={8}
              style={styles.removeBtn}
            >
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </Pressable>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="star-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Watchlist Items</Text>
            <Text style={styles.emptySub}>Tap the star on any stock to add it here</Text>
            <Pressable style={styles.browseBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.browseBtnText}>Explore Markets</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, includeFontPadding: false },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder },
  itemWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg },
  removeBtn: { paddingLeft: Spacing.sm, paddingBottom: Spacing.sm },
  listContent: { paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  emptySub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', includeFontPadding: false },
  browseBtn: { backgroundColor: Colors.primaryDim, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.pill, borderWidth: 1, borderColor: Colors.primary, marginTop: Spacing.sm },
  browseBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary, includeFontPadding: false },
});
