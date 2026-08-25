import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet } from 'react-native';

type Props = {
  size?: number;
};

export function AppLogo({ size = 72 }: Props) {
  return (
    <Image
      source={require('../../assets/images/appicon.png')}
      style={[
        styles.logo,
        { width: size, height: size, borderRadius: size * 0.22 },
      ]}
      contentFit="cover"
      accessibilityLabel="제주 길모아"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    overflow: 'hidden',
  },
});
