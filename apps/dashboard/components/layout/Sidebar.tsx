import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  SIDEBAR_WIDTH,
  spacing,
} from "../../design-system/tokens";

interface NavItem {
  label: string;
  route: "/" | "/orders" | "/crm" | "/menu" | "/settings";
  // Ionicons icon name — typed loosely because the full union is enormous.
  icon: React.ComponentProps<typeof Ionicons>["name"];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", route: "/", icon: "home-outline" },
  { label: "Orders", route: "/orders", icon: "receipt-outline" },
  { label: "Customers", route: "/crm", icon: "people-outline" },
  { label: "Menu", route: "/menu", icon: "restaurant-outline" },
  { label: "Settings", route: "/settings", icon: "settings-outline" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={styles.sidebar}>
      {/* Brand */}
      <View style={styles.brand}>
        <Text style={styles.brandText}>Odyssey</Text>
      </View>

      {/* Nav links */}
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          // Mark the item active if the current path matches (exact for /, prefix for others).
          const isActive =
            item.route === "/" ? pathname === "/" : pathname.startsWith(item.route);

          return (
            <Pressable
              key={item.route}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.navItem,
                isActive && styles.navItemActive,
                !isActive && (pressed || hovered) && styles.navItemHover,
              ]}
              onPress={() => router.push(item.route)}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={isActive ? colors.primary[500] : colors.stone[400]}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.stone[900],
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
  },
  brand: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[700],
    marginBottom: spacing[4],
  },
  brandText: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.primary[500],
    letterSpacing: 0.5,
  },
  nav: { gap: spacing[1], paddingHorizontal: spacing[3] },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
    borderRadius: radius.md,
  },
  navItemActive: { backgroundColor: colors.stone[800] },
  navItemHover: { backgroundColor: colors.stone[800] },
  navLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.stone[400] },
  navLabelActive: { color: colors.white },
});
