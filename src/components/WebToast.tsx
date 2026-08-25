import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { TabBarTokens } from '../constants/tabs';

export type NativeToastKind = 'success' | 'error' | 'info';

export type NativeToastState = {
  visible: boolean;
  id: string;
  kind: NativeToastKind;
  message: string;
  duration: number;
  actions: { id: string; label: string; tone?: 'default' | 'primary' | 'danger' }[];
};

type Props = {
  toast: NativeToastState;
  insetTop: number;
  onHide: () => void;
  onAction: (id: string) => void;
};

export const HIDDEN_NATIVE_TOAST: NativeToastState = {
  visible: false,
  id: '',
  kind: 'info',
  message: '',
  duration: 2000,
  actions: [],
};

export default function WebToast({ toast, insetTop, onHide, onAction }: Props): React.JSX.Element | null {
  useEffect(() => {
    if (!toast.visible) return
    const timer = setTimeout(onHide, toast.duration)
    return () => clearTimeout(timer)
  }, [toast.visible, toast.id, toast.duration, onHide])

  if (!toast.visible) return null

  return (
    <View style={[styles.wrap, { paddingTop: insetTop + 8 }]} pointerEvents="box-none">
      <View style={styles.card} accessibilityRole="alert">
        <View style={styles.icon}>
          <ToastGlyph kind={toast.kind} />
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.actions.map((action) => (
          <Pressable key={action.id} onPress={() => onAction(action.id)} hitSlop={8}>
            <Text style={[styles.action, action.tone === 'primary' && styles.actionPrimary, action.tone === 'danger' && styles.actionDanger]}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function ToastGlyph({ kind }: { kind: NativeToastKind }): React.JSX.Element {
  const color = kind === 'success' ? TabBarTokens.active : kind === 'error' ? '#E85D4C' : '#1E4FC4'
  if (kind === 'error') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
        <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    )
  }
  if (kind === 'success') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
        <Path d="M8 12.5l2.5 2.5L16 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    )
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path d="M12 11v6M12 8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    zIndex: 40,
    elevation: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 360,
    marginHorizontal: 16,
    minHeight: 54,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  icon: {
    width: 20,
    height: 20,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  action: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  actionPrimary: {
    color: TabBarTokens.active,
  },
  actionDanger: {
    color: '#E85D4C',
  },
});
