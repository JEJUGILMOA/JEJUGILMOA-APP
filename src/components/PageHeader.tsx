import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import {
  PageHeaderTokens,
  type HeaderAction,
} from '../constants/header';

type Props = {
  title: string;
  showBack?: boolean;
  insetTop?: number;
  rightText?: string;
  actions?: HeaderAction[];
  onBack?: () => void;
  onAction?: (id: string) => void;
};

function ChevronLeftIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18 9 12l6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoreIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill={color}
      />
    </Svg>
  );
}

function BookmarkIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function actionColor(tone: HeaderAction['tone']) {
  if (tone === 'muted') return PageHeaderTokens.muted;
  if (tone === 'primary') return PageHeaderTokens.primary;
  return PageHeaderTokens.titleColor;
}

export default function PageHeader({
  title,
  showBack = false,
  insetTop = 0,
  rightText,
  actions = [],
  onBack,
  onAction,
}: Props): React.JSX.Element {
  return (
    <View style={[styles.root, { paddingTop: insetTop }]}>
      <View style={styles.bar}>
        <View style={styles.left}>
          {showBack ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="뒤로 가기"
              hitSlop={4}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <ChevronLeftIcon color={PageHeaderTokens.titleColor} size={22} />
            </Pressable>
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {rightText || actions.length > 0 ? (
          <View style={styles.right}>
            {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
            {actions.map((action) => {
              const color = actionColor(action.tone);
              const isSkip = action.tone === 'muted';
              return (
                <Pressable
                  key={action.id}
                  onPress={() => onAction?.(action.id)}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  style={({ pressed }) => [
                    styles.actionButton,
                    isSkip && styles.skipAction,
                    pressed && !isSkip && styles.pressed,
                  ]}
                >
                  {({ pressed }) =>
                    action.icon === 'more' ? (
                      <MoreIcon color={color} />
                    ) : action.icon === 'bookmark' ? (
                      <BookmarkIcon color={color} />
                    ) : (
                      <Text
                        style={[
                          styles.actionLabel,
                          { color: isSkip && pressed ? PageHeaderTokens.mutedPressed : color },
                          action.tone === 'primary' && styles.actionPrimary,
                          isSkip && styles.actionMuted,
                        ]}
                      >
                        {action.label}
                      </Text>
                    )
                  }
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: PageHeaderTokens.background,
  },
  bar: {
    minHeight: PageHeaderTokens.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 4,
    gap: 8,
  },
  left: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: PageHeaderTokens.gap,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  pressed: {
    backgroundColor: '#F3F4F6',
  },
  title: {
    flex: 1,
    fontSize: PageHeaderTokens.titleSize,
    fontWeight: PageHeaderTokens.titleWeight,
    color: PageHeaderTokens.titleColor,
    letterSpacing: -0.6,
  },
  right: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightText: {
    fontSize: 12,
    color: PageHeaderTokens.muted,
  },
  actionButton: {
    minHeight: PageHeaderTokens.touch,
    minWidth: PageHeaderTokens.touch,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  actionLabel: {
    fontSize: 14,
  },
  actionMuted: {
    fontSize: 14,
  },
  actionPrimary: {
    fontWeight: '600',
  },
  skipAction: {
    paddingRight: 14,
  },
});
