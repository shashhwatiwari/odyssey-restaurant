import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, fontSize, fontWeight, radius, shadow, spacing } from "../../design-system/tokens";

interface ModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  // Max width of the dialog box (default 480)
  maxWidth?: number;
}

export function Modal({ visible, title, onClose, children, maxWidth = 480 }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Dimmed backdrop — pressing it closes the modal */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.center}
        >
          {/* Stop backdrop press from propagating into the dialog */}
          <Pressable style={[styles.dialog, { maxWidth }]} onPress={() => {}}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.body}>{children}</View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  center: { width: "100%", alignItems: "center", paddingHorizontal: spacing[4] },
  dialog: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    ...shadow.lg,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[200],
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.stone[900] },
  close: { fontSize: fontSize.base, color: colors.stone[400] },
  body: { padding: spacing[6] },
});
