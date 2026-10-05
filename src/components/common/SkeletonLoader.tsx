import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = BorderRadius.md,
  style,
}) => {
  const [opacityAnim] = React.useState(() => new Animated.Value(0.3));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const HomeSkeleton = () => {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.headerSkeleton}>
        <Skeleton width={120} height={18} />
        <Skeleton width={160} height={28} style={{ marginTop: 8 }} />
      </View>

      <View style={styles.carouselSkeleton}>
        <Skeleton width={150} height={150} borderRadius={16} />
        <Skeleton width={150} height={150} borderRadius={16} />
        <Skeleton width={150} height={150} borderRadius={16} />
      </View>

      <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
        <Skeleton width={180} height={22} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={56} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={56} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={56} style={{ marginBottom: 12 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.dark.cardHighlight,
  },
  skeletonContainer: {
    paddingTop: 20,
  },
  headerSkeleton: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  carouselSkeleton: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
  },
});
