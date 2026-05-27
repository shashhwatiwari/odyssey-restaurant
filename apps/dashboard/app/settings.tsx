import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useGetSettings, usePatchSettings } from "@ody/api-client";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../contexts/ToastContext";
import { colors, fontSize, fontWeight, spacing } from "../design-system/tokens";

// ── Form field helpers ────────────────────────────────────────────────────────

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <View style={styles.rowControl}>{children}</View>
    </View>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { show: showToast } = useToast();
  const { data, isLoading } = useGetSettings();

  // Local form state — mirrors the settings fields. Initialised from server data.
  const [autoAccept, setAutoAccept] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [prepTime, setPrepTime] = useState("15");
  const [openingHour, setOpeningHour] = useState("9");
  const [closingHour, setClosingHour] = useState("22");

  // Sync form state when server data arrives (first load only).
  // useEffect with [data] runs once when the query resolves.
  useEffect(() => {
    if (!data) return;
    setAutoAccept(data.autoAccept);
    setServiceAvailable(data.serviceAvailable);
    setPrepTime(String(data.prepTimeMinutes));
    setOpeningHour(String(data.openingHour));
    setClosingHour(String(data.closingHour));
  }, [data]);

  const { mutate: saveSettings, isPending } = usePatchSettings({
    mutation: {
      onSuccess: () => showToast("Settings saved", "success"),
      onError: () => showToast("Failed to save settings", "error"),
    },
  });

  function handleSave() {
    const prepNum = parseInt(prepTime, 10);
    const openNum = parseInt(openingHour, 10);
    const closeNum = parseInt(closingHour, 10);

    if (isNaN(prepNum) || prepNum < 1 || prepNum > 480) {
      showToast("Prep time must be 1–480 minutes", "error"); return;
    }
    if (isNaN(openNum) || openNum < 0 || openNum > 23) {
      showToast("Opening hour must be 0–23", "error"); return;
    }
    if (isNaN(closeNum) || closeNum < 0 || closeNum > 23) {
      showToast("Closing hour must be 0–23", "error"); return;
    }

    saveSettings({
      data: {
        autoAccept,
        serviceAvailable,
        prepTimeMinutes: prepNum,
        openingHour: openNum,
        closingHour: closeNum,
      },
    });
  }

  return (
    <PageLayout title="Settings">
      <Card style={styles.card}>
        {isLoading ? (
          <View style={{ gap: spacing[4] }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={44} />)}
          </View>
        ) : (
          <View style={styles.form}>
            <SettingRow
              label="Service available"
              description="When off, the restaurant is closed and new orders cannot be placed."
            >
              <Switch
                value={serviceAvailable}
                onValueChange={setServiceAvailable}
                trackColor={{ true: colors.primary[600], false: colors.stone[300] }}
              />
            </SettingRow>

            <View style={styles.divider} />

            <SettingRow
              label="Auto-accept orders"
              description="Automatically move new orders to 'accepted' instead of 'pending'."
            >
              <Switch
                value={autoAccept}
                onValueChange={setAutoAccept}
                trackColor={{ true: colors.primary[600], false: colors.stone[300] }}
              />
            </SettingRow>

            <View style={styles.divider} />

            <SettingRow
              label="Prep time (minutes)"
              description="Estimated time from accepted to ready. Shown to staff as a guide."
            >
              <Input
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="number-pad"
                style={styles.numberInput}
              />
            </SettingRow>

            <View style={styles.divider} />

            <SettingRow
              label="Opening hour (0–23)"
              description="Hour the restaurant opens. Stored as an integer (e.g. 9 = 9:00 AM)."
            >
              <Input
                value={openingHour}
                onChangeText={setOpeningHour}
                keyboardType="number-pad"
                style={styles.numberInput}
              />
            </SettingRow>

            <View style={styles.divider} />

            <SettingRow
              label="Closing hour (0–23)"
              description="Hour the restaurant closes (e.g. 22 = 10:00 PM)."
            >
              <Input
                value={closingHour}
                onChangeText={setClosingHour}
                keyboardType="number-pad"
                style={styles.numberInput}
              />
            </SettingRow>

            <View style={styles.saveRow}>
              <Button label="Save changes" onPress={handleSave} loading={isPending} />
            </View>
          </View>
        )}
      </Card>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  card: { maxWidth: 640 },
  form: { gap: spacing[4] },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[4] },
  rowLabel: { flex: 1, gap: spacing[1] },
  rowControl: { flexShrink: 0 },
  label: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.stone[800] },
  description: { fontSize: fontSize.xs, color: colors.stone[500] },
  divider: { height: 1, backgroundColor: colors.stone[100] },
  numberInput: { width: 80, textAlign: "center" },
  saveRow: { alignItems: "flex-end", paddingTop: spacing[2] },
});
