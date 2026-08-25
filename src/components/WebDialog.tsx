import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { WebDialogAction } from '../bridge/webviewBridge';
import { TabBarTokens } from '../constants/tabs';

export type WebDialogState = {
  visible: boolean;
  id: string;
  title: string;
  description?: string;
  actions: WebDialogAction[];
};

type Props = {
  dialog: WebDialogState;
  onAction: (id: string) => void;
  onDismiss: () => void;
};

export const HIDDEN_WEB_DIALOG: WebDialogState = {
  visible: false,
  id: '',
  title: '',
  actions: [],
};

/** 웹 Modal과 같은 딤·패널을 네이티브 창으로 띄워 지도 Surface 위에 올린다. */
export default function WebDialog({ dialog, onAction, onDismiss }: Props): React.JSX.Element {
  return (
    <Modal
      visible={dialog.visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="닫기" />
        <View style={styles.panel}>
          <Text style={styles.title}>{dialog.title}</Text>
          {dialog.description ? (
            <Text style={styles.description}>{dialog.description}</Text>
          ) : null}
          <View style={styles.actions}>
            {dialog.actions.map((action) => (
              <Pressable
                key={action.id}
                style={[styles.button, buttonStyle(action.variant)]}
                onPress={() => onAction(action.id)}
              >
                <Text style={[styles.buttonLabel, buttonLabelStyle(action.variant)]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function buttonStyle(variant: WebDialogAction['variant']) {
  if (variant === 'ghost' || variant === 'outline' || variant === 'secondary') {
    return styles.buttonGhost;
  }
  if (variant === 'danger') return styles.buttonDanger;
  return styles.buttonPrimary;
}

function buttonLabelStyle(variant: WebDialogAction['variant']) {
  if (variant === 'ghost' || variant === 'outline' || variant === 'secondary') {
    return styles.buttonLabelGhost;
  }
  return styles.buttonLabelOnColor;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(37, 37, 45, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 24,
    zIndex: 1,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: -0.3,
    paddingHorizontal: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: TabBarTokens.active,
  },
  buttonDanger: {
    backgroundColor: '#E85D4C',
  },
  buttonGhost: {
    backgroundColor: '#F3F4F8',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonLabelOnColor: {
    color: '#FFFFFF',
  },
  buttonLabelGhost: {
    color: '#1A1A1A',
  },
});
