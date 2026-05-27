import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fontWeight, spacing } from "../../design-system/tokens";

interface PageLayoutProps {
  title: string;
  // Optional action rendered top-right (e.g. "New Order" button).
  action?: React.ReactNode;
  children: React.ReactNode;
  // Set to false for pages that manage their own scroll (e.g. full-bleed tables).
  scrollable?: boolean;
}

export function PageLayout({ title, action, children, scrollable = true }: PageLayoutProps) {
  const content = (
    <View style={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {action && <View>{action}</View>}
      </View>
      {children}
    </View>
  );

  if (!scrollable) {
    return <View style={styles.page}>{content}</View>;
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.scroll}>
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.stone[50] },
  scroll: { flexGrow: 1 },
  inner: { flex: 1, padding: spacing[8] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[6],
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.stone[900],
  },
});
