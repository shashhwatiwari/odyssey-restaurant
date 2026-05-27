import { StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetOrdersId,
  usePatchOrdersIdStatus,
  getGetOrdersQueryKey,
  getGetOrdersIdQueryKey,
} from "@ody/api-client";
import type { GetOrders200ItemStatus } from "@ody/api-client";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { useToast } from "../../contexts/ToastContext";
import { colors, fontSize, fontWeight, spacing } from "../../design-system/tokens";
import { formatPrice, formatOrderNumber, formatRelativeTime } from "../../utils/format";

// Maps each status to which statuses it can transition to next.
// This mirrors ORDER_TRANSITIONS in the backend — the server enforces it;
// we use it here only to decide which buttons to render.
const NEXT_STATUSES: Partial<Record<GetOrders200ItemStatus, GetOrders200ItemStatus[]>> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
};

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
}

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();

  // Only fetch when a row has been clicked (orderId is non-null).
  const { data: order, isLoading } = useGetOrdersId(orderId ?? "", {
    query: { enabled: !!orderId },
  });

  const { mutate: updateStatus, isPending } = usePatchOrdersIdStatus({
    mutation: {
      onSuccess: (updated) => {
        // Invalidate both the list and this specific order in the React Query cache
        // so the table and modal both show the new status without a page reload.
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOrdersIdQueryKey(orderId ?? "") });
        showToast(`Order ${formatOrderNumber(updated.orderNumber)} → ${updated.status}`, "success");
      },
      onError: () => showToast("Failed to update status", "error"),
    },
  });

  const nextStatuses = order ? (NEXT_STATUSES[order.status] ?? []) : [];

  return (
    <Modal
      visible={!!orderId}
      title={order ? `Order ${formatOrderNumber(order.orderNumber)}` : "Order detail"}
      onClose={onClose}
    >
      {isLoading || !order ? (
        <View style={styles.loadingBody}>
          <Skeleton height={20} style={{ marginBottom: spacing[3] }} />
          <Skeleton height={20} width="60%" style={{ marginBottom: spacing[3] }} />
          <Skeleton height={80} />
        </View>
      ) : (
        <View style={styles.body}>
          {/* Meta row */}
          <View style={styles.metaRow}>
            <Badge label={order.status} status={order.status} />
            <Text style={styles.metaText}>{order.customer.name}</Text>
            <Text style={styles.metaText}>{formatRelativeTime(order.createdAt)}</Text>
          </View>

          {/* Line items */}
          <View style={styles.items}>
            {order.items.map((item) => (
              <View key={item.id} style={styles.lineItem}>
                <Text style={styles.itemName}>
                  {item.quantity}× {item.menuItem.name}
                </Text>
                <Text style={styles.itemPrice}>{formatPrice(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          </View>

          {/* Notes */}
          {order.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          )}

          {/* Status transition buttons */}
          {nextStatuses.length > 0 && (
            <View style={styles.actions}>
              {nextStatuses.map((next) => (
                <Button
                  key={next}
                  label={`→ ${next}`}
                  variant={next === "cancelled" || next === "rejected" ? "danger" : "primary"}
                  size="sm"
                  loading={isPending}
                  onPress={() =>
                    updateStatus({ id: order.id, data: { status: next } })
                  }
                />
              ))}
            </View>
          )}
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingBody: { gap: spacing[2] },
  body: { gap: spacing[4] },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[3], flexWrap: "wrap" },
  metaText: { fontSize: fontSize.sm, color: colors.stone[500] },

  items: {
    borderWidth: 1,
    borderColor: colors.stone[200],
    borderRadius: 8,
    overflow: "hidden",
  },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[100],
  },
  itemName: { fontSize: fontSize.sm, color: colors.stone[700] },
  itemPrice: { fontSize: fontSize.sm, color: colors.stone[700] },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.stone[200],
  },
  totalLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.stone[700] },
  totalValue: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.stone[900] },

  notes: { gap: spacing[1] },
  notesLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.stone[500], textTransform: "uppercase" },
  notesText: { fontSize: fontSize.sm, color: colors.stone[600] },

  actions: { flexDirection: "row", gap: spacing[2], flexWrap: "wrap", paddingTop: spacing[2] },
});
