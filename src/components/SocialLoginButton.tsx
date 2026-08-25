import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  icon: React.ReactNode;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function SocialLoginButton({
  label,
  backgroundColor,
  textColor,
  borderColor,
  icon,
  onPress,
  loading = false,
  disabled = false,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: borderColor ?? backgroundColor,
          opacity: pressed || disabled ? 0.85 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            <View style={styles.iconSlot}>{icon}</View>
            <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  iconSlot: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
