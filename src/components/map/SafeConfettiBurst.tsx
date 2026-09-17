import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

import { MapTokens } from '../../constants/map';

const COLORS = [
  MapTokens.green,
  MapTokens.amber,
  MapTokens.yellow,
  '#FFFFFF',
  MapTokens.greenSoft,
  '#FF8A65',
] as const;

const PARTICLE_COUNT = 28;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Particle = {
  key: string;
  color: string;
  size: number;
  startX: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
};

/**
 * Reanimated 미사용 컨페티.
 * gorhom BottomSheet와 shared value를 공유하지 않아 시트 붕괴를 피한다.
 */
export default function SafeConfettiBurst({
  active,
}: {
  active: boolean;
}): React.JSX.Element | null {
  const particles = useMemo(() => {
    const originX = SCREEN_W * 0.5;
    const list: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      list.push({
        key: `p-${i}`,
        color: COLORS[i % COLORS.length]!,
        size: 6 + (i % 5),
        startX: originX + (i % 7) * 4 - 12,
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        rotate: new Animated.Value(0),
        opacity: new Animated.Value(0),
      });
    }
    return list;
  }, []);

  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animRef.current?.stop();
    particles.forEach((p) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.rotate.setValue(0);
      p.opacity.setValue(0);
    });

    if (!active) {
      return;
    }

    const originY = SCREEN_H * 0.28;
    const animations = particles.map((p, index) => {
      const angle = -Math.PI * 0.85 + (Math.PI * 1.7 * index) / PARTICLE_COUNT;
      const distance = 120 + (index % 6) * 28;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance + 40 + (index % 4) * 18;
      const duration = 900 + (index % 5) * 120;

      return Animated.sequence([
        Animated.delay(40 + (index % 8) * 18),
        Animated.parallel([
          Animated.timing(p.opacity, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: dx,
            duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(p.y, {
            toValue: dy,
            duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(p.rotate, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(duration * 0.55),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: duration * 0.45,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    animRef.current = Animated.parallel(animations);
    animRef.current.start();

    return () => {
      animRef.current?.stop();
    };
  }, [active, particles]);

  if (!active) {
    return null;
  }

  const originY = SCREEN_H * 0.28;

  return (
    <View style={styles.layer} pointerEvents="none">
      {particles.map((p) => {
        const spin = p.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${(p.size % 2 === 0 ? 1 : -1) * 240}deg`],
        });
        return (
          <Animated.View
            key={p.key}
            style={[
              styles.piece,
              {
                width: p.size,
                height: p.size * 0.55,
                borderRadius: 2,
                backgroundColor: p.color,
                left: p.startX,
                top: originY,
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { rotate: spin },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 1001,
    elevation: 1001,
  },
  piece: {
    position: 'absolute',
  },
});
