// Powered by OnSpace.AI
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme';

interface BadgeProps {
  value: number | string;
  type?: 'gain' | 'loss' | 'neutral' | 'primary' | 'warning';
  prefix?: string;
  suffix?: string;
  showSign?: boolean;
  size?: 'sm' | 'md';
}

export const Badge = memo(({ value, type, prefix = '', suffix = '', showSign = false, size = 'md' }: BadgeProps) => {
  const numVal = typeof value === 'number' ? value : parseFloat(value as string);
  const resolvedType = type ?? (numVal >= 0 ? 'gain' : 'loss');
  const sign = showSign && numVal > 0 ? '+' : '';
  const display = typeof value === 'number' ? `${prefix}${sign}${numVal.toFixed(2)}${suffix}` : `${prefix}${value}${suffix}`;

  const bgColor = resolvedType === 'gain' ? Colors.gainBg
    : resolvedType === 'loss' ? Colors.lossBg
    : resolvedType === 'primary' ? Colors.primaryDim
    : resolvedType === 'warning' ? Colors.warningBg
    : Colors.surfaceBorder;

  const textColor = resolvedType === 'gain' ? Colors.gain
    : resolvedType === 'loss' ? Colors.loss
    : resolvedType === 'primary' ? Colors.primary
    : resolvedType === 'warning' ? Colors.warning
    : Colors.textSecondary;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, size === 'sm' && styles.badgeSm]}>
      <Text style={[styles.text, { color: textColor }, size === 'sm' && styles.textSm]}>{display}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    includeFontPadding: false,
  },
  textSm: {
    fontSize: FontSize.xs,
  },
});
