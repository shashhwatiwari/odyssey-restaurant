import { ActivityIndicator } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button } from "../../components/ui/Button";

describe("Button", () => {
  it("renders the label", () => {
    render(<Button label="Save" onPress={() => {}} />);
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    render(<Button label="Go" onPress={onPress} />);
    fireEvent.press(screen.getByText("Go"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    render(<Button label="Go" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText("Go"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not call onPress when loading", () => {
    const onPress = jest.fn();
    render(<Button label="Saving" onPress={onPress} loading />);
    fireEvent.press(screen.getByText("Saving"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows an ActivityIndicator when loading", () => {
    render(<Button label="Saving" onPress={() => {}} loading />);
    // UNSAFE_getByType finds a host component by its constructor.
    // Used here because ActivityIndicator has no testID or accessible label.
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("does not show an ActivityIndicator when not loading", () => {
    render(<Button label="Save" onPress={() => {}} />);
    expect(screen.UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  });

  it("renders all variants without crashing", () => {
    const variants = ["primary", "secondary", "ghost", "danger"] as const;
    for (const variant of variants) {
      const { unmount } = render(
        <Button label={variant} onPress={() => {}} variant={variant} />
      );
      expect(screen.getByText(variant)).toBeTruthy();
      unmount();
    }
  });
});
