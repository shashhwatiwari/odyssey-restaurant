import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fontWeight, radius, shadow, spacing } from "../../design-system/tokens";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Select({ label, options, value, onChange, placeholder = "Select…" }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Trigger button */}
      <Pressable
        style={({ pressed }: { pressed: boolean }) => [
          styles.trigger,
          pressed && styles.triggerPressed,
        ]}
        onPress={() => setOpen((v) => !v)}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Text style={styles.chevron}>{open ? "▲" : "▼"}</Text>
      </Pressable>

      {/* Inline dropdown — appears below trigger, absolute positioned */}
      {open && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            {options.map((opt) => (
              <Pressable
                key={opt.value}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                  opt.value === value && styles.optionSelected,
                ]}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    opt.value === value && styles.optionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative", zIndex: 10 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.stone[700], marginBottom: spacing[1] },

  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.stone[300],
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  triggerPressed: { backgroundColor: colors.stone[50] },
  triggerText: { fontSize: fontSize.base, color: colors.stone[900] },
  placeholder: { color: colors.stone[400] },
  chevron: { fontSize: fontSize.xs, color: colors.stone[500] },

  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stone[200],
    ...shadow.md,
  },
  scroll: { maxHeight: 200 },

  option: { paddingHorizontal: spacing[3], paddingVertical: spacing[2] + 2 },
  optionPressed: { backgroundColor: colors.stone[50] },
  optionSelected: { backgroundColor: colors.primary[50] },
  optionText: { fontSize: fontSize.base, color: colors.stone[800] },
  optionTextSelected: { color: colors.primary[700], fontWeight: fontWeight.semibold },
});
