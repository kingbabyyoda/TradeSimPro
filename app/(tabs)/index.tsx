// Powered by OnSpace.AI
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { StockListItem } from '@/components/feature/StockListItem';
import { usePortfolio } from '@/hooks/usePortfolio';
import { fetchBatchQuotes, searchTickers, StockQuote, SearchResult } from '@/services/polygon';
import { POPULAR_TICKERS, MARKET_INDICES } from '@/constants/config';

type Category = 'Popular' | 'Indices' | 'Search';

export default function MarketsScreen() {
  const router = useRouter();
  const { apiKey, checkPendingOrders, updateBatchPrices } = usePortfolio();
  const [category, setCategory] = useState<Category>('Popular');
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadQuotes = useCallback(async (symbols: string[]) => {
    if (!apiKey || symbols.length === 0) return;
    setIsLoadingQuotes(true);
    try {
      const data = await fetchBatchQuotes(symbols, apiKey);
      setQuotes(prev => ({ ...prev, ...data }));
      const prices: Record<string, number> = {};
      for (const [sym, q] of Object.entries(data)) prices[sym] = q.price;
      updateBatchPrices(prices);
      checkPendingOrders(prices);
    } finally {
      setIsLoadingQuotes(false);
    }
  }, [apiKey, updateBatchPrices, checkPendingOrders]);

  useEffect(() => {
    if (category === 'Popular') loadQuotes(POPULAR_TICKERS.map(t => t.symbol));
    else if (category === 'Indices') loadQuotes(MARKET_INDICES.map(t => t.symbol));
  }, [category, loadQuotes]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      if (!apiKey) return;
      setIsSearching(true);
      try {
        const results = await searchTickers(q, apiKey);
        setSearchResults(results);
        if (results.length > 0) {
          loadQuotes(results.slice(0, 10).map(r => r.symbol));
        }
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, [apiKey, loadQuotes]);

  const displayList = category === 'Search'
    ? searchResults.map(r => ({ symbol: r.symbol, name: r.name }))
    : category === 'Popular' ? POPULAR_TICKERS : MARKET_INDICES;

  const categories: Category[] = ['Popular', 'Indices', 'Search'];

  const topGainers = Object.values(quotes)
    .filter(q => q.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Markets</Text>
          <Text style={styles.headerSub}>Live Stock Data</Text>
        </View>
        <Pressable
          style={styles.settingsBtn}
          onPress={() => router.push('/onboarding' as any)}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Top Movers */}
      {topGainers.length > 0 && category !== 'Search' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Movers</Text>
          <View style={styles.moversRow}>
            {topGainers.map(q => (
              <Pressable
                key={q.symbol}
                style={({ pressed }) => [styles.moverCard, pressed && { opacity: 0.8 }]}
                onPress={() => router.push({ pathname: '/stock/[symbol]' as any, params: { symbol: q.symbol } })}
              >
                <Text style={styles.moverSymbol}>{q.symbol}</Text>
                <Text style={styles.moverPrice}>${q.price.toFixed(2)}</Text>
                <View style={[styles.moverBadge, { backgroundColor: Colors.gainBg }]}>
                  <Text style={[styles.moverChange, { color: Colors.gain }]}>+{q.changePercent.toFixed(2)}%</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Category Tabs */}
      <View style={styles.catRow}>
        {categories.map(cat => (
          <Pressable key={cat} onPress={() => { setCategory(cat); if (cat !== 'Search') setSearchQuery(''); }} style={[styles.catBtn, category === cat && styles.catBtnActive]}>
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </View>

      {/* Search Input */}
      {category === 'Search' && (
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search ticker or company..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            returnKeyType="search"
            autoFocus
          />
          {isSearching && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>
      )}

      {/* List */}
      <FlatList
        data={displayList}
        keyExtractor={item => item.symbol}
        renderItem={({ item }) => (
          <StockListItem
            symbol={item.symbol}
            name={item.name}
            quote={quotes[item.symbol]}
            isLoading={isLoadingQuotes && !quotes[item.symbol]}
            onPress={() => router.push({ pathname: '/stock/[symbol]' as any, params: { symbol: item.symbol, name: item.name } })}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          category === 'Search' && !isSearching && searchQuery.length > 1 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No results for "{searchQuery}"</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, includeFontPadding: false },
  headerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, includeFontPadding: false },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, includeFontPadding: false },
  moversRow: { flexDirection: 'row', gap: Spacing.sm },
  moverCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder },
  moverSymbol: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 2, includeFontPadding: false },
  moverPrice: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, includeFontPadding: false },
  moverBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  moverChange: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, includeFontPadding: false },
  catRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  catBtn: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  catBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  catText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, includeFontPadding: false },
  catTextActive: { color: Colors.primary },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, paddingHorizontal: Spacing.md },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: FontSize.md, color: Colors.textPrimary },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 24 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, includeFontPadding: false },
});
