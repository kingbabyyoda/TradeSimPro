// Powered by OnSpace.AI
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

export const Divider = ({ vertical = false, spacing = Spacing.md }: { vertical?: boolean; spacing?: number }) => (
  <View style={[vertical ? styles.vertical : styles.horizontal, { margin: spacing }]} />
);

const styles = StyleSheet.create({
  horizontal: { height: 1, backgroundColor: Colors.surfaceBorder },
  vertical: { width: 1, backgroundColor: Colors.surfaceBorder },
});
