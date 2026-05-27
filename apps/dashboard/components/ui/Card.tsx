import { StyleSheet, View, type ViewProps } from "react-native";
import { colors, radius, shadow, spacing } from "../../design-system/tokens";

interface CardProps extends ViewProps {
  elevation?: "sm" | "md" | "lg";
  padding?: number;
}

export function Card({ elevation = "sm", padding = spacing[4], style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        shadow[elevation],
        { padding },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stone[200],
  },
});
