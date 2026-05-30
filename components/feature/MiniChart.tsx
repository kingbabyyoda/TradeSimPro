// Powered by OnSpace.AI
import React, { memo } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/theme';
import { AggBar } from '@/services/polygon';

interface MiniChartProps {
  data: AggBar[];
  width?: number;
  height?: number;
  isGain?: boolean;
}

export const MiniChart = memo(function MiniChart({ data, width = Dimensions.get('window').width - 32, height = 160, isGain = true }: MiniChartProps) {
  if (!data || data.length < 2) return <View style={[styles.empty, { width, height }]} />;

  const prices = data.map(d => d.close);
  const color = isGain ? Colors.gain : Colors.loss;

  return (
    <LineChart
      data={{
        labels: [],
        datasets: [{ data: prices }],
      }}
      width={width}
      height={height}
      withDots={false}
      withInnerLines={false}
      withOuterLines={false}
      withVerticalLabels={false}
      withHorizontalLabels={false}
      chartConfig={{
        backgroundColor: 'transparent',
        backgroundGradientFrom: Colors.surface,
        backgroundGradientTo: Colors.surface,
        decimalPlaces: 2,
        color: () => color,
        labelColor: () => Colors.textMuted,
        propsForBackgroundLines: { stroke: Colors.chartGrid, strokeWidth: 0.5 },
      }}
      bezier
      style={styles.chart}
    />
  );
});

const styles = StyleSheet.create({
  empty: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
  },
  chart: {
    borderRadius: 8,
    paddingRight: 0,
  },
});
