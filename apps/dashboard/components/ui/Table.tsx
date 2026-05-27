import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fontWeight, spacing } from "../../design-system/tokens";
import { SkeletonList } from "./Skeleton";

export interface Column<T> {
  key: string;
  header: string;
  width?: number;
  // render() receives the row and returns whatever you want in the cell.
  render: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  onRowPress?: (row: T) => void;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  onRowPress,
  emptyMessage = "No data",
}: TableProps<T>) {
  if (loading) {
    return <SkeletonList rows={6} rowHeight={44} />;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        {/* Header row */}
        <View style={styles.headerRow}>
          {columns.map((col) => (
            <View key={col.key} style={[styles.cell, col.width ? { width: col.width } : styles.flex]}>
              <Text style={styles.headerText}>{col.header}</Text>
            </View>
          ))}
        </View>

        {/* Data rows */}
        {data.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          data.map((row) => (
            <Pressable
              key={keyExtractor(row)}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.dataRow,
                (pressed || hovered) && styles.dataRowHover,
              ]}
              onPress={onRowPress ? () => onRowPress(row) : undefined}
              disabled={!onRowPress}
            >
              {columns.map((col) => (
                <View key={col.key} style={[styles.cell, col.width ? { width: col.width } : styles.flex]}>
                  {col.render(row)}
                </View>
              ))}
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.stone[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[200],
  },
  dataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[100],
  },
  dataRowHover: { backgroundColor: colors.stone[50] },
  cell: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    justifyContent: "center",
  },
  flex: { flex: 1, minWidth: 100 },
  headerText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.stone[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyRow: { paddingVertical: spacing[8], alignItems: "center" },
  emptyText: { fontSize: fontSize.sm, color: colors.stone[400] },
});
