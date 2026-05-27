import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fontWeight, radius, shadow, spacing } from "../design-system/tokens";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  opacity: Animated.Value;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counter.current;
    const opacity = new Animated.Value(0);

    setToasts((prev) => [...prev, { id, message, type, opacity }]);

    // Fade in, hold for 3.5s, fade out, then remove from state.
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(3100),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    });
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast stack — fixed bottom-right, stacked vertically */}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((t) => (
          <Animated.View
            key={t.id}
            style={[styles.toast, toastTypeStyles[t.type], { opacity: t.opacity }]}
          >
            <Text style={styles.toastText}>{t.message}</Text>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const toastTypeStyles: Record<ToastType, object> = {
  success: { backgroundColor: colors.success[600] },
  error: { backgroundColor: colors.error[600] },
  info: { backgroundColor: colors.stone[800] },
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: spacing[6],
    right: spacing[6],
    gap: spacing[2],
    // zIndex high so toasts appear above modals.
    zIndex: 9999,
    maxWidth: 360,
  },
  toast: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    ...shadow.lg,
  },
  toastText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
});
