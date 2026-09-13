import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { WebDialogAction } from '../bridge/webviewBridge';
import { TabBarTokens } from '../constants/tabs';

/** FE Button danger / primary 토큰과 맞춤 */
const ButtonColors = {
  danger: '#FF4C4C',
  dangerPressed: '#973131',
  primary: TabBarTokens.active,
  primaryPressed: '#17783C',
  ghost: '#F3F4F8',
  ghostPressed: '#EAEAE7',
  labelOnColor: '#FFFFFF',
  labelGhost: '#1A1A1A',
} as const;

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
        {/* 패널 탭이 딤 onDismiss로 새지 않도록 터치 흡수 */}
        <Pressable style={styles.panel} onPress={() => undefined}>
          <View style={styles.body}>
            <Text style={styles.title}>{dialog.title}</Text>
            {dialog.description ? (
              <Text style={styles.description}>{dialog.description}</Text>
            ) : null}
          </View>
          <View style={styles.actions}>
            {dialog.actions.map((action) => (
              <Pressable
                key={action.id}
                style={({ pressed }) => [
                  styles.button,
                  buttonStyle(action.variant, pressed),
                ]}
                onPress={() => onAction(action.id)}
              >
                {({ pressed }) => (
                  <Text
                    style={[
                      styles.buttonLabel,
                      buttonLabelStyle(action.variant),
                      pressed && isGhostVariant(action.variant)
                        ? styles.buttonLabelGhostPressed
                        : null,
                    ]}
                  >
                    {action.label}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

function isGhostVariant(variant: WebDialogAction['variant']) {
  return variant === 'ghost' || variant === 'outline' || variant === 'secondary';
}

function buttonStyle(
  variant: WebDialogAction['variant'],
  pressed: boolean,
): StyleProp<ViewStyle> {
  if (isGhostVariant(variant)) {
    return pressed ? styles.buttonGhostPressed : styles.buttonGhost;
  }
  if (variant === 'danger') {
    return pressed ? styles.buttonDangerPressed : styles.buttonDanger;
  }
  return pressed ? styles.buttonPrimaryPressed : styles.buttonPrimary;
}

function buttonLabelStyle(variant: WebDialogAction['variant']) {
  if (isGhostVariant(variant)) {
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
    zIndex: 1,
    elevation: 8,
  },
  body: {
    gap: 8,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 20,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: ButtonColors.primary,
  },
  buttonPrimaryPressed: {
    backgroundColor: ButtonColors.primaryPressed,
  },
  buttonDanger: {
    backgroundColor: ButtonColors.danger,
  },
  buttonDangerPressed: {
    backgroundColor: ButtonColors.dangerPressed,
  },
  buttonGhost: {
    backgroundColor: ButtonColors.ghost,
  },
  buttonGhostPressed: {
    backgroundColor: ButtonColors.ghostPressed,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonLabelOnColor: {
    color: ButtonColors.labelOnColor,
  },
  buttonLabelGhost: {
    color: ButtonColors.labelGhost,
  },
  buttonLabelGhostPressed: {
    color: '#45484F',
  },
});
