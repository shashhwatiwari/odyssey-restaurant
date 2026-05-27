import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Skeleton, SkeletonList } from "../components/ui/Skeleton";
import { Table, type Column } from "../components/ui/Table";
import { useToast } from "../contexts/ToastContext";
import { colors, fontSize, fontWeight, orderStatusColors, spacing } from "../design-system/tokens";

// ── Tiny section wrapper ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ── Sample table data ─────────────────────────────────────────────────────────

interface SampleRow {
  id: string;
  name: string;
  status: string;
  total: string;
}

const SAMPLE_ROWS: SampleRow[] = [
  { id: "1", name: "Alice Wang", status: "pending", total: "$24.00" },
  { id: "2", name: "Bob Marley", status: "accepted", total: "$41.50" },
  { id: "3", name: "Carol White", status: "preparing", total: "$18.75" },
  { id: "4", name: "Dan Brown", status: "ready", total: "$63.20" },
  { id: "5", name: "Eve Davis", status: "completed", total: "$9.99" },
];

const TABLE_COLUMNS: Column<SampleRow>[] = [
  { key: "name", header: "Customer", render: (r) => <Text style={styles.cell}>{r.name}</Text> },
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
    render: (r) => <Text style={styles.cell}>{r.total}</Text>,
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UILibraryScreen() {
  const { show: showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectValue, setSelectValue] = useState("");

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>UI Library</Text>
      <Text style={styles.pageSubtitle}>Design system components and tokens</Text>

      {/* ── Buttons ── */}
      <Section title="Buttons">
        <View style={styles.row}>
          <Button label="Primary" onPress={() => showToast("Primary clicked", "info")} variant="primary" />
          <Button label="Secondary" onPress={() => showToast("Secondary clicked", "info")} variant="secondary" />
          <Button label="Ghost" onPress={() => showToast("Ghost clicked", "info")} variant="ghost" />
          <Button label="Danger" onPress={() => showToast("Danger clicked", "error")} variant="danger" />
        </View>
        <View style={[styles.row, { marginTop: spacing[3] }]}>
          <Button label="Small" onPress={() => {}} size="sm" />
          <Button label="Medium" onPress={() => {}} size="md" />
          <Button label="Large" onPress={() => {}} size="lg" />
          <Button label="Loading" onPress={() => {}} loading />
          <Button label="Disabled" onPress={() => {}} disabled />
        </View>
      </Section>

      {/* ── Badges ── */}
      <Section title="Order Status Badges">
        <View style={styles.row}>
          {Object.keys(orderStatusColors).map((status) => (
            <Badge key={status} label={status} status={status} />
          ))}
        </View>
      </Section>

      {/* ── Inputs ── */}
      <Section title="Inputs">
        <View style={styles.formGrid}>
          <Input
            label="Normal input"
            placeholder="Enter text…"
            value={inputValue}
            onChangeText={setInputValue}
          />
          <Input
            label="With helper"
            placeholder="help@example.com"
            helper="We'll never share your email."
          />
          <Input
            label="With error"
            placeholder="Bad value"
            value="wrong"
            error="This field is required"
          />
          <Input label="Disabled" placeholder="Can't touch this" editable={false} />
        </View>
      </Section>

      {/* ── Select ── */}
      <Section title="Select">
        <View style={{ maxWidth: 280 }}>
          <Select
            label="Pick a status"
            options={Object.keys(orderStatusColors).map((s) => ({ label: s, value: s }))}
            value={selectValue}
            onChange={setSelectValue}
            placeholder="Filter by status…"
          />
        </View>
      </Section>

      {/* ── Cards ── */}
      <Section title="Cards">
        <View style={styles.row}>
          {(["sm", "md", "lg"] as const).map((elev) => (
            <Card key={elev} elevation={elev} style={styles.demoCard}>
              <Text style={styles.cardTitle}>elevation: {elev}</Text>
              <Text style={styles.cardBody}>Shadow increases with elevation.</Text>
            </Card>
          ))}
        </View>
      </Section>

      {/* ── Skeletons ── */}
      <Section title="Skeleton loaders">
        <Skeleton height={20} style={{ marginBottom: spacing[2] }} />
        <Skeleton height={20} width="70%" style={{ marginBottom: spacing[2] }} />
        <Skeleton height={20} width="50%" style={{ marginBottom: spacing[4] }} />
        <SkeletonList rows={3} rowHeight={44} />
      </Section>

      {/* ── Table ── */}
      <Section title="Table">
        <Card padding={0}>
          <Table
            columns={TABLE_COLUMNS}
            data={SAMPLE_ROWS}
            keyExtractor={(r) => r.id}
            onRowPress={(r) => showToast(`Clicked: ${r.name}`, "info")}
          />
        </Card>
        <View style={{ marginTop: spacing[4] }}>
          <Text style={styles.subLabel}>Loading state:</Text>
          <Table
            columns={TABLE_COLUMNS}
            data={[]}
            keyExtractor={(r) => r.id}
            loading
          />
        </View>
      </Section>

      {/* ── Empty state ── */}
      <Section title="Empty State">
        <Card>
          <EmptyState
            title="Nothing here yet"
            description="Empty states appear when a list has no items."
            actionLabel="Add something"
            onAction={() => showToast("Action triggered", "success")}
          />
        </Card>
      </Section>

      {/* ── Modal ── */}
      <Section title="Modal">
        <Button label="Open modal" onPress={() => setModalOpen(true)} variant="secondary" />
        <Modal visible={modalOpen} title="Example modal" onClose={() => setModalOpen(false)}>
          <Text style={styles.modalBody}>
            Modals use React Native's built-in Modal component with a dimmed backdrop.
            Press the backdrop or ✕ to dismiss.
          </Text>
          <View style={[styles.row, { marginTop: spacing[4] }]}>
            <Button label="Cancel" onPress={() => setModalOpen(false)} variant="ghost" />
            <Button
              label="Confirm"
              onPress={() => {
                setModalOpen(false);
                showToast("Confirmed!", "success");
              }}
              variant="primary"
            />
          </View>
        </Modal>
      </Section>

      {/* ── Toasts ── */}
      <Section title="Toasts">
        <View style={styles.row}>
          <Button label="Success toast" onPress={() => showToast("Saved successfully!", "success")} variant="secondary" />
          <Button label="Error toast" onPress={() => showToast("Something went wrong.", "error")} variant="secondary" />
          <Button label="Info toast" onPress={() => showToast("Order #42 updated.", "info")} variant="secondary" />
        </View>
      </Section>

      {/* ── Color palette ── */}
      <Section title="Color palette">
        <View style={styles.palette}>
          {Object.entries(colors.primary).map(([k, v]) => (
            <View key={k} style={[styles.swatch, { backgroundColor: v }]}>
              <Text style={styles.swatchLabel}>{k}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.palette, { marginTop: spacing[2] }]}>
          {Object.entries(colors.stone).map(([k, v]) => (
            <View key={k} style={[styles.swatch, { backgroundColor: v }]}>
              <Text style={[styles.swatchLabel, Number(k) >= 500 && { color: colors.white }]}>{k}</Text>
            </View>
          ))}
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.stone[50] },
  content: { padding: spacing[8], gap: spacing[8], paddingBottom: spacing[16] },

  pageTitle: { fontSize: fontSize["3xl"], fontWeight: fontWeight.bold, color: colors.stone[900] },
  pageSubtitle: { fontSize: fontSize.base, color: colors.stone[500], marginTop: spacing[1] },

  section: { gap: spacing[4] },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.stone[800],
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[200],
    paddingBottom: spacing[2],
  },

  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing[3], alignItems: "center" },
  formGrid: { gap: spacing[4], maxWidth: 480 },

  cell: { fontSize: fontSize.sm, color: colors.stone[800] },

  demoCard: { flex: 1, minWidth: 140, gap: spacing[1] },
  cardTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.stone[700] },
  cardBody: { fontSize: fontSize.xs, color: colors.stone[500] },

  subLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.stone[600], marginBottom: spacing[2] },

  modalBody: { fontSize: fontSize.base, color: colors.stone[600], lineHeight: 22 },

  palette: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  swatch: { width: 56, height: 48, justifyContent: "flex-end", padding: 4, borderRadius: 4 },
  swatchLabel: { fontSize: 9, fontWeight: fontWeight.semibold, color: colors.stone[800] },
});
