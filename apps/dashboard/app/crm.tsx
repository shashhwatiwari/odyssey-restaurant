import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useGetCustomers, useGetCustomersId } from "@ody/api-client";
import type { GetCustomers200Item } from "@ody/api-client";
import { PageLayout } from "../components/layout/PageLayout";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { Table, type Column } from "../components/ui/Table";
import { colors, fontSize, fontWeight, spacing } from "../design-system/tokens";
import { formatPrice, formatOrderNumber, formatRelativeTime } from "../utils/format";

// ── Customer table columns ───────────────────────────────────────────────────

const COLUMNS: Column<GetCustomers200Item>[] = [
  {
    key: "name",
    header: "Name",
    render: (r) => <Text style={styles.cell}>{r.name}</Text>,
  },
  {
    key: "email",
    header: "Email",
    render: (r) => (
      <Text style={styles.cellMuted}>{r.email ?? "—"}</Text>
    ),
  },
  {
    key: "phone",
    header: "Phone",
    width: 130,
    render: (r) => <Text style={styles.cellMuted}>{r.phone ?? "—"}</Text>,
  },
  {
    key: "orderCount",
    header: "Orders",
    width: 80,
    render: (r) => <Text style={styles.cell}>{r.orderCount}</Text>,
  },
  {
    key: "totalSpend",
    header: "Total spend",
    width: 110,
    render: (r) => <Text style={styles.cell}>{formatPrice(r.totalSpend)}</Text>,
  },
];

// ── Customer detail modal ────────────────────────────────────────────────────

function CustomerDetailModal({
  customerId,
  onClose,
}: {
  customerId: string | null;
  onClose: () => void;
}) {
  // Only enabled when a customer is selected.
  const { data, isLoading } = useGetCustomersId(customerId ?? "", {
    query: { enabled: !!customerId },
  });

  return (
    <Modal
      visible={!!customerId}
      title={data ? data.name : "Customer"}
      onClose={onClose}
    >
      {isLoading || !data ? (
        <View style={{ gap: spacing[3] }}>
          <Skeleton height={18} />
          <Skeleton height={18} width="70%" />
          <Skeleton height={80} style={{ marginTop: spacing[2] }} />
        </View>
      ) : (
        <View style={styles.detailBody}>
          {/* Contact info */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{data.email ?? "—"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{data.phone ?? "—"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Orders</Text>
            <Text style={styles.infoValue}>{data.orderCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total spend</Text>
            <Text style={styles.infoValue}>{formatPrice(data.totalSpend)}</Text>
          </View>

          {/* Recent orders */}
          <Text style={styles.ordersTitle}>Recent orders</Text>
          {data.orders.length === 0 ? (
            <Text style={styles.cellMuted}>No orders yet</Text>
          ) : (
            <View style={styles.recentOrders}>
              {data.orders.map((order) => (
                <View key={order.id} style={styles.recentRow}>
                  <Text style={styles.cell}>{formatOrderNumber(order.orderNumber)}</Text>
                  <Badge label={order.status} status={order.status} />
                  <Text style={styles.cellMuted}>{formatPrice(order.total)}</Text>
                  <Text style={styles.cellMuted}>{formatRelativeTime(order.createdAt)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CrmScreen() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const { data = [], isLoading } = useGetCustomers();

  return (
    <PageLayout title="Customers" scrollable={false}>
      <Card padding={0} style={{ flex: 1 }}>
        <Table
          columns={COLUMNS}
          data={data}
          keyExtractor={(r) => r.id}
          loading={isLoading}
          onRowPress={(r) => setSelectedCustomerId(r.id)}
          emptyMessage="No customers yet"
        />
      </Card>

      <CustomerDetailModal
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  cell: { fontSize: fontSize.sm, color: colors.stone[800] },
  cellMuted: { fontSize: fontSize.sm, color: colors.stone[400] },
  detailBody: { gap: spacing[3] },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { fontSize: fontSize.sm, color: colors.stone[500] },
  infoValue: { fontSize: fontSize.sm, color: colors.stone[800], fontWeight: fontWeight.medium },
  ordersTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.stone[700],
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.stone[200],
  },
  recentOrders: { gap: spacing[2] },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flexWrap: "wrap",
  },
});
