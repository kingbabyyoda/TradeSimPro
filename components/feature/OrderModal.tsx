// Powered by OnSpace.AI
import React, { useState, useCallback, memo } from 'react';
import {
  View, Text, Modal, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { StockQuote } from '@/services/polygon';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAlert } from '@/template';
import { Ionicons } from '@expo/vector-icons';

type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS';
type TradeType = 'BUY' | 'SELL';

interface OrderModalProps {
  visible: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
  quote: StockQuote | null;
}

export const OrderModal = memo(({ visible, onClose, symbol, name, quote }: OrderModalProps) => {
  const { executeTrade, placePendingOrder, portfolio } = usePortfolio();
  const { showAlert } = useAlert();
  const [tradeType, setTradeType] = useState<TradeType>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [shares, setShares] = useState('');
  const [limitPrice, setLimitPrice] = useState('');

  const currentPrice = quote?.price ?? 0;
  const sharesNum = parseFloat(shares) || 0;
  const limitPriceNum = parseFloat(limitPrice) || currentPrice;
  const execPrice = orderType === 'MARKET' ? currentPrice : limitPriceNum;
  const total = sharesNum * execPrice;

  const position = portfolio.positions.find(p => p.symbol === symbol);

  const handleSubmit = useCallback(() => {
    if (!sharesNum || sharesNum <= 0) {
      showAlert('Invalid Order', 'Please enter a valid number of shares.');
      return;
    }
    if (orderType === 'MARKET') {
      const result = executeTrade({ symbol, name, type: tradeType, orderType: 'MARKET', shares: sharesNum, price: currentPrice });
      showAlert(result.success ? 'Order Filled' : 'Order Failed', result.message);
      if (result.success) { setShares(''); onClose(); }
    } else {
      if (!limitPriceNum || limitPriceNum <= 0) {
        showAlert('Invalid Price', 'Please enter a valid limit/stop price.');
        return;
      }
      const result = placePendingOrder({ symbol, name, type: tradeType, orderType: orderType as 'LIMIT' | 'STOP_LOSS', shares: sharesNum, targetPrice: limitPriceNum });
      showAlert(result.success ? 'Order Placed' : 'Order Failed', result.message);
      if (result.success) { setShares(''); setLimitPrice(''); onClose(); }
    }
  }, [sharesNum, limitPriceNum, orderType, tradeType, currentPrice, symbol, name, executeTrade, placePendingOrder, showAlert, onClose]);

  const orderTypeOptions: OrderType[] = ['MARKET', 'LIMIT', 'STOP_LOSS'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{symbol}</Text>
              <Text style={styles.subtitle}>{name}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Current Price */}
          <View style={styles.priceRow}>
            <Text style={styles.currentPriceLabel}>Current Price</Text>
            <Text style={styles.currentPrice}>${currentPrice.toFixed(2)}</Text>
          </View>

          {/* Trade Type Toggle */}
          <View style={styles.toggleRow}>
            {(['BUY', 'SELL'] as TradeType[]).map(t => (
              <Pressable
                key={t}
                onPress={() => setTradeType(t)}
                style={[styles.toggleBtn, tradeType === t && (t === 'BUY' ? styles.toggleBuyActive : styles.toggleSellActive)]}
              >
                <Text style={[styles.toggleText, tradeType === t && styles.toggleTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {/* Order Type */}
          <Text style={styles.sectionLabel}>Order Type</Text>
          <View style={styles.orderTypeRow}>
            {orderTypeOptions.map(ot => (
              <Pressable
                key={ot}
                onPress={() => setOrderType(ot)}
                style={[styles.orderTypeBtn, orderType === ot && styles.orderTypeBtnActive]}
              >
                <Text style={[styles.orderTypeText, orderType === ot && styles.orderTypeTextActive]}>
                  {ot.replace('_', ' ')}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Shares Input */}
          <Text style={styles.sectionLabel}>Shares</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={shares}
              onChangeText={setShares}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
            />
            {position && (
              <Pressable style={styles.maxBtn} onPress={() => setShares(String(position.shares))}>
                <Text style={styles.maxBtnText}>MAX ({position.shares})</Text>
              </Pressable>
            )}
          </View>

          {/* Limit / Stop Price */}
          {orderType !== 'MARKET' && (
            <>
              <Text style={styles.sectionLabel}>{orderType === 'LIMIT' ? 'Limit Price' : 'Stop Price'}</Text>
              <TextInput
                style={styles.input}
                value={limitPrice}
                onChangeText={setLimitPrice}
                keyboardType="decimal-pad"
                placeholder={currentPrice.toFixed(2)}
                placeholderTextColor={Colors.textMuted}
              />
            </>
          )}

          {/* Summary */}
          {sharesNum > 0 && (
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Total</Text>
                <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Available Cash</Text>
                <Text style={styles.summaryValue}>${portfolio.cash.toFixed(2)}</Text>
              </View>
            </View>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: tradeType === 'BUY' ? Colors.gain : Colors.loss },
              pressed && styles.submitBtnPressed,
            ]}
          >
            <Text style={styles.submitText}>
              {orderType === 'MARKET' ? `${tradeType} NOW` : `PLACE ${orderType.replace('_', ' ')} ORDER`}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.surfaceBorder, alignSelf: 'center', marginBottom: Spacing.lg,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, includeFontPadding: false },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg, backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md, padding: Spacing.md },
  currentPriceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, includeFontPadding: false },
  currentPrice: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  toggleRow: { flexDirection: 'row', marginBottom: Spacing.lg, gap: Spacing.sm },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder },
  toggleBuyActive: { backgroundColor: Colors.gainBg, borderColor: Colors.gain },
  toggleSellActive: { backgroundColor: Colors.lossBg, borderColor: Colors.loss },
  toggleText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textSecondary, includeFontPadding: false },
  toggleTextActive: { color: Colors.textPrimary },
  sectionLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, includeFontPadding: false },
  orderTypeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  orderTypeBtn: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.md, alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder },
  orderTypeBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  orderTypeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, includeFontPadding: false },
  orderTypeTextActive: { color: Colors.primary },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  input: {
    flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: FontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  maxBtn: { backgroundColor: Colors.primaryDim, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary },
  maxBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary, includeFontPadding: false },
  summary: { backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, includeFontPadding: false },
  summaryValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, includeFontPadding: false },
  submitBtn: { paddingVertical: 16, borderRadius: BorderRadius.lg, alignItems: 'center' },
  submitBtnPressed: { opacity: 0.8 },
  submitText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#fff', includeFontPadding: false },
});
