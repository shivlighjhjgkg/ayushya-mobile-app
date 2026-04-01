// components/Toast.tsx
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface ToastProps {
  msg: string;
  show: boolean;
}

export default function Toast({ msg, show }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: show ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [show]);

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.text}>✓  {msg}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});