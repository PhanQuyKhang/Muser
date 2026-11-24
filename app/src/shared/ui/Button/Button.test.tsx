import { fireEvent, render, screen } from "@testing-library/react-native";

import { Button } from "./Button";

describe("Button", () => {
  it("calls onPress", async () => {
    const onPress = jest.fn();
    await render(<Button label="Log in" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Log in" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire while loading and reports busy", async () => {
    const onPress = jest.fn();
    await render(<Button label="Log in" onPress={onPress} loading />);
    const button = screen.getByRole("button", { name: "Log in" });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  });

  it("does not fire when disabled", async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
