import { render, screen } from "@testing-library/react-native";
import { Badge } from "../../components/ui/Badge";
import { orderStatusColors } from "../../design-system/tokens";

describe("Badge", () => {
  it("renders the label text", () => {
    render(<Badge label="pending" status="pending" />);
    expect(screen.getByText("pending")).toBeTruthy();
  });

  it("renders without crashing for every order status", () => {
    const statuses = Object.keys(orderStatusColors);
    for (const status of statuses) {
      const { unmount } = render(<Badge label={status} status={status} />);
      expect(screen.getByText(status)).toBeTruthy();
      unmount();
    }
  });

  it("applies the correct background color for each order status", () => {
    const statuses = Object.keys(orderStatusColors) as Array<keyof typeof orderStatusColors>;

    for (const status of statuses) {
      // toJSON() returns the host component tree as a plain object — simpler
      // to assert on than navigating RTL's ReactTestInstance parent chain.
      const { toJSON, unmount } = render(<Badge label={status} status={status} />);
      const tree = toJSON() as { props: { style: object[] } };

      // The outer View receives [styles.badge, { backgroundColor }].
      // One of those objects should contain the expected backgroundColor.
      const allStyles = tree.props.style.flat();
      expect(allStyles).toContainEqual(
        expect.objectContaining({ backgroundColor: orderStatusColors[status].bg })
      );
      unmount();
    }
  });

  it("uses explicit bg when status is not provided", () => {
    const { toJSON } = render(<Badge label="custom" bg="#FF0000" textColor="#FFFFFF" />);
    const tree = toJSON() as { props: { style: object[] } };
    const allStyles = tree.props.style.flat();
    expect(allStyles).toContainEqual(expect.objectContaining({ backgroundColor: "#FF0000" }));
  });
});
