import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, fontSize, fontWeight, radius, spacing } from "../../design-system/tokens";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, style, ...rest }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : styles.inputNormal,
          rest.editable === false && styles.inputDisabled,
          style,
        ]}
        placeholderTextColor={colors.stone[400]}
        {...rest}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helper && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[1] },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.stone[700],
  },
  input: {
    fontSize: fontSize.base,
    color: colors.stone[900],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  inputNormal: { borderColor: colors.stone[300] },
  inputError: { borderColor: colors.error[600] },
  inputDisabled: { backgroundColor: colors.stone[50], color: colors.stone[400] },
  errorText: { fontSize: fontSize.xs, color: colors.error[600] },
  helperText: { fontSize: fontSize.xs, color: colors.stone[500] },
});
