import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSize, fontWeight, radius, spacing } from "../../design-system/tokens";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        (pressed || hovered) && !isDisabled && styles[`variant_${variant}_hover`],
        isDisabled && styles.disabled,
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? colors.white : colors.primary[600]}
          style={styles.spinner}
        />
      )}
      <Text style={[styles.label, styles[`label_${size}`], styles[`label_${variant}`]]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
  },
  spinner: { marginRight: spacing[2] },

  // Sizes
  size_sm: { paddingHorizontal: spacing[3], paddingVertical: spacing[1] + 2 },
  size_md: { paddingHorizontal: spacing[4], paddingVertical: spacing[2] + 2 },
  size_lg: { paddingHorizontal: spacing[6], paddingVertical: spacing[3] },

  // Variants — background + border
  variant_primary: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  variant_primary_hover: { backgroundColor: colors.primary[700], borderColor: colors.primary[700] },
  variant_secondary: { backgroundColor: colors.white, borderColor: colors.stone[300] },
  variant_secondary_hover: { backgroundColor: colors.stone[50] },
  variant_ghost: { backgroundColor: "transparent", borderColor: "transparent" },
  variant_ghost_hover: { backgroundColor: colors.stone[100] },
  variant_danger: { backgroundColor: colors.error[600], borderColor: colors.error[600] },
  variant_danger_hover: { backgroundColor: colors.error[700], borderColor: colors.error[700] },

  disabled: { opacity: 0.45 },

  // Label text
  label: { fontWeight: fontWeight.semibold },
  label_sm: { fontSize: fontSize.xs },
  label_md: { fontSize: fontSize.sm },
  label_lg: { fontSize: fontSize.base },
  label_primary: { color: colors.white },
  label_secondary: { color: colors.stone[800] },
  label_ghost: { color: colors.stone[700] },
  label_danger: { color: colors.white },
});
