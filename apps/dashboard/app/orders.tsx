import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useGetOrders } from "@ody/api-client";
import type { GetOrders200Item, GetOrdersStatus } from "@ody/api-client";
import { PageLayout } from "../components/layout/PageLayout";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Select } from "../components/ui/Select";
import { Table, type Column } from "../components/ui/Table";
import { OrderDetailModal } from "../components/orders/OrderDetailModal";
import { colors, fontSize } from "../design-system/tokens";
import { formatPrice, formatOrderNumber, formatRelativeTime } from "../utils/format";

// All possible order statuses — used to populate the filter dropdown.
const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Rejected", value: "rejected" },
];

const COLUMNS: Column<GetOrders200Item>[] = [
  {
    key: "orderNumber",
    header: "Order",
    width: 90,
    render: (r) => <Text style={styles.cellMono}>{formatOrderNumber(r.orderNumber)}</Text>,
  },
  {
    key: "customer",
    header: "Customer",
    render: (r) => <Text style={styles.cell}>{r.customer.name}</Text>,
  },
  {
    key: "status",
    header: "Status",
    width: 130,
    render: (r) => <Badge label={r.status} status={r.status} />,
  },
  {
    key: "total",
    header: "Total",
    width: 100,
    render: (r) => <Text style={styles.cell}>{formatPrice(r.total)}</Text>,
  },
  {
    key: "createdAt",
    header: "Placed",
    width: 110,
    render: (r) => <Text style={styles.cellMuted}>{formatRelativeTime(r.createdAt)}</Text>,
  },
];

export default function OrdersScreen() {
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Pass status param only when something is selected; empty string → no filter.
  const { data = [], isLoading } = useGetOrders(
    statusFilter ? { status: statusFilter as GetOrdersStatus } : undefined
  );

  return (
    <PageLayout title="Orders" scrollable={false}>
      {/* Filter bar */}
      <Select
        options={STATUS_OPTIONS}
        value={statusFilter}
        onChange={setStatusFilter}
        placeholder="Filter by status…"
      />

      {/* Orders table — wrapped in Card with no padding so the table bleeds edge-to-edge */}
      <Card padding={0} style={{ marginTop: 16, flex: 1 }}>
        <Table
          columns={COLUMNS}
          data={data}
          keyExtractor={(r) => r.id}
          loading={isLoading}
          onRowPress={(r) => setSelectedOrderId(r.id)}
          emptyMessage="No orders match the current filter"
        />
      </Card>

      {/* Detail modal — fetches full order when an id is set */}
      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  cell: { fontSize: fontSize.sm, color: colors.stone[800] },
  cellMono: { fontSize: fontSize.sm, color: colors.stone[800] },
  cellMuted: { fontSize: fontSize.sm, color: colors.stone[400] },
});
