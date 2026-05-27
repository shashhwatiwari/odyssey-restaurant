import { StyleSheet, Text, View } from "react-native";
import { orderStatusColors } from "../../design-system/tokens";
import { fontSize, fontWeight, radius, spacing } from "../../design-system/tokens";

interface BadgeProps {
  label: string;
  // Pass an order status string to get semantic coloring, or pass explicit colors.
  status?: string;
  bg?: string;
  textColor?: string;
}

export function Badge({ label, status, bg, textColor }: BadgeProps) {
  const palette = status ? orderStatusColors[status] : undefined;

  const backgroundColor = bg ?? palette?.bg ?? "#F3F4F6";
  const color = textColor ?? palette?.text ?? "#374151";

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "capitalize",
  },
});
