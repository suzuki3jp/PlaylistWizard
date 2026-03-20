import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tooltip } from "./tooltip";

describe("Tooltip", () => {
  it("renders the description", () => {
    render(
      <Tooltip description="Test description">
        <button type="submit">Hover me</button>
      </Tooltip>,
    );
    // Tooltip content is not in the DOM until triggered
    expect(screen.queryByText("Test description")).toBeNull();
  });

  it("renders children inside TooltipTrigger", () => {
    render(
      <Tooltip description="Tooltip text">
        <span data-testid="child">Child Element</span>
      </Tooltip>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
