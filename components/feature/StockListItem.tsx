// Powered by OnSpace.AI
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { StockQuote } from '@/services/polygon';

interface StockListItemProps {
  symbol: string;
  name: string;
  quote?: StockQuote | null;
  isLoading?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

export const StockListItem = memo(({ symbol, name, quote, isLoading, onPress, compact }: StockListItemProps) => {
  const isGain = (quote?.changePercent ?? 0) >= 0;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed, compact && styles.compact]}
    >
      <View style={styles.left}>
        <View style={styles.iconBg}>
          <Text style={styles.iconText}>{symbol[0]}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
        </View>
      </View>
      <View style={styles.right}>
        {isLoading ? (
          <View style={styles.loadingBar} />
        ) : quote ? (
          <>
            <Text style={styles.price}>${quote.price.toFixed(2)}</Text>
            <Badge
              value={quote.changePercent}
              type={isGain ? 'gain' : 'loss'}
              showSign
              suffix="%"
              size="sm"
            />
          </>
        ) : (
          <Text style={styles.noData}>—</Text>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  compact: {
    padding: Spacing.sm,
    marginBottom: 6,
  },
  pressed: { opacity: 0.75 },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  info: { flex: 1 },
  symbol: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  name: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    includeFontPadding: false,
  },
  right: { alignItems: 'flex-end', minWidth: 80 },
  price: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    marginBottom: 4,
  },
  noData: { color: Colors.textMuted, fontSize: FontSize.sm },
  loadingBar: {
    height: 14,
    width: 60,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 4,
    marginBottom: 4,
  },
});
