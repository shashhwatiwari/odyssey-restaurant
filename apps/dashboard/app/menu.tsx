import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMenuCategories,
  useGetMenuItems,
  usePatchMenuItemsId,
  usePostMenuItems,
  getGetMenuItemsQueryKey,
} from "@ody/api-client";
import type { GetMenuItems200Item, GetMenuCategories200Item } from "@ody/api-client";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../contexts/ToastContext";
import { colors, fontSize, fontWeight, spacing } from "../design-system/tokens";
import { formatPrice } from "../utils/format";

// ── Add-item modal ────────────────────────────────────────────────────────────

function AddItemModal({
  visible,
  categories,
  onClose,
}: {
  visible: boolean;
  categories: GetMenuCategories200Item[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: createItem, isPending } = usePostMenuItems({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMenuItemsQueryKey() });
        showToast("Item added", "success");
        // Reset form
        setName(""); setDescription(""); setPrice(""); setCategoryId(""); setErrors({});
        onClose();
      },
      onError: () => showToast("Failed to add item", "error"),
    },
  });

  function handleSubmit() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required";
    if (!categoryId) next.categoryId = "Category is required";
    // Price is stored as cents — multiply the dollar value the user typed.
    const priceNum = Math.round(parseFloat(price) * 100);
    if (!price || isNaN(priceNum) || priceNum <= 0) next.price = "Enter a valid price (e.g. 12.99)";
    if (Object.keys(next).length > 0) { setErrors(next); return; }

    createItem({ data: { name: name.trim(), description: description.trim() || null, price: priceNum, categoryId } });
  }

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));

  return (
    <Modal visible={visible} title="Add menu item" onClose={onClose}>
      <View style={styles.form}>
        <Input label="Name" value={name} onChangeText={setName} error={errors.name} placeholder="e.g. Grilled Salmon" />
        <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="Short description…" />
        <Input label="Price ($)" value={price} onChangeText={setPrice} error={errors.price} placeholder="12.99" keyboardType="decimal-pad" />
        <Select label="Category" options={categoryOptions} value={categoryId} onChange={setCategoryId} placeholder="Select category…" />
        {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId}</Text>}
        <View style={styles.formActions}>
          <Button label="Cancel" onPress={onClose} variant="ghost" />
          <Button label="Add item" onPress={handleSubmit} loading={isPending} />
        </View>
      </View>
    </Modal>
  );
}

// ── Menu item row ─────────────────────────────────────────────────────────────

function MenuItemRow({ item }: { item: GetMenuItems200Item }) {
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();

  const { mutate: patchItem, isPending } = usePatchMenuItemsId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMenuItemsQueryKey() });
      },
      onError: () => showToast("Failed to update item", "error"),
    },
  });

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
      </View>
      <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
      {/* Switch toggles isAvailable. disabled while mutation is in-flight. */}
      <Switch
        value={item.isAvailable}
        disabled={isPending}
        onValueChange={(val) => patchItem({ id: item.id, data: { isAvailable: val } })}
        trackColor={{ true: colors.primary[600], false: colors.stone[300] }}
      />
    </View>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("__all__");

  const { data: categories = [], isLoading: catsLoading } = useGetMenuCategories();
  const { data: items = [], isLoading: itemsLoading } = useGetMenuItems(
    activeCategoryId === "__all__" ? undefined : { categoryId: activeCategoryId }
  );

  const categoryTabs = [
    { label: "All", value: "__all__" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  return (
    <PageLayout
      title="Menu"
      action={<Button label="Add item" onPress={() => setAddModalOpen(true)} size="sm" />}
      scrollable={false}
    >
      {/* Category filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        <View style={styles.tabRow}>
          {categoryTabs.map((tab) => (
            <Pressable
              key={tab.value}
              style={[styles.tab, activeCategoryId === tab.value && styles.tabActive]}
              onPress={() => setActiveCategoryId(tab.value)}
            >
              <Text style={[styles.tabText, activeCategoryId === tab.value && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Items list */}
      <ScrollView style={styles.list}>
        {itemsLoading || catsLoading ? (
          <SkeletonList rows={8} rowHeight={56} />
        ) : (
          <Card padding={0}>
            {items.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No items in this category</Text>
              </View>
            ) : (
              items.map((item) => <MenuItemRow key={item.id} item={item} />)
            )}
          </Card>
        )}
      </ScrollView>

      <AddItemModal
        visible={addModalOpen}
        categories={categories}
        onClose={() => setAddModalOpen(false)}
      />
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  tabs: { marginBottom: spacing[4], flexGrow: 0 },
  tabRow: { flexDirection: "row", gap: spacing[2], paddingBottom: spacing[1] },
  tab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 99,
    backgroundColor: colors.stone[100],
  },
  tabActive: { backgroundColor: colors.primary[600] },
  tabText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.stone[600] },
  tabTextActive: { color: colors.white },

  list: { flex: 1 },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[100],
    gap: spacing[3],
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.stone[800] },
  itemDesc: { fontSize: fontSize.xs, color: colors.stone[400], marginTop: 2 },
  itemPrice: { fontSize: fontSize.sm, color: colors.stone[600], minWidth: 60, textAlign: "right" },

  emptyRow: { padding: spacing[8], alignItems: "center" },
  emptyText: { fontSize: fontSize.sm, color: colors.stone[400] },

  form: { gap: spacing[4] },
  formActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing[3], marginTop: spacing[2] },
  errorText: { fontSize: fontSize.xs, color: colors.error[600] },
});
