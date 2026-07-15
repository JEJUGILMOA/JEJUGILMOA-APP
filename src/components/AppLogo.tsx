import React from 'react';
import { StyleSheet, View } from 'react-native';

import { LoginColors } from '@/constants/login';

type Props = {
  size?: number;
};

export function AppLogo({ size = 72 }: Props) {
  return <View style={[styles.logo, { width: size, height: size, borderRadius: size * 0.22 }]} />;
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: LoginColors.brandGreen,
  },
});
