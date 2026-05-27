import { Slot, usePathname } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, StyleSheet } from "react-native";
import { ToastProvider } from "../contexts/ToastContext";
import { Sidebar } from "../components/layout/Sidebar";
import { colors } from "../design-system/tokens";

// QueryClient is the React Query cache. One instance lives at the app root
// and all hooks (useGetOrders, etc.) share it via QueryClientProvider.
const queryClient = new QueryClient();

// Expo Router calls this file automatically as the root layout.
// Slot renders whichever file-based route is currently active.
export default function RootLayout() {
  const pathname = usePathname();

  // The UI library route is a standalone page — no sidebar chrome.
  const showSidebar = pathname !== "/ui-library";

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {showSidebar ? (
          <View style={styles.shell}>
            <Sidebar />
            <View style={styles.content}>
              <Slot />
            </View>
          </View>
        ) : (
          <Slot />
        )}
      </ToastProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: "row", backgroundColor: colors.stone[50] },
  content: { flex: 1 },
});
