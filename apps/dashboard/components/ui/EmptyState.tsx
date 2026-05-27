import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fontWeight, spacing } from "../../design-system/tokens";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.icon}>📭</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
    gap: spacing[2],
  },
  icon: { fontSize: 40, marginBottom: spacing[2] },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.stone[700] },
  description: { fontSize: fontSize.sm, color: colors.stone[400], textAlign: "center", maxWidth: 320 },
  action: { marginTop: spacing[4] },
});
