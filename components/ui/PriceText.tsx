// Powered by OnSpace.AI
import React, { memo } from 'react';
import { Text, TextStyle } from 'react-native';
import { Colors, FontSize, FontWeight } from '@/constants/theme';

interface PriceTextProps {
  value: number;
  prefix?: string;
  size?: number;
  weight?: TextStyle['fontWeight'];
  showSign?: boolean;
  colorize?: boolean;
  style?: TextStyle;
}

export const PriceText = memo(({ value, prefix = '$', size = FontSize.base, weight = FontWeight.semibold, showSign = false, colorize = false, style }: PriceTextProps) => {
  const sign = showSign && value > 0 ? '+' : '';
  const color = colorize ? (value >= 0 ? Colors.gain : Colors.loss) : Colors.textPrimary;
  return (
    <Text style={[{ fontSize: size, fontWeight: weight, color, includeFontPadding: false }, style]}>
      {prefix}{sign}{value.toFixed(2)}
    </Text>
  );
});
