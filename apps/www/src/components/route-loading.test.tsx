import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RouteLoading } from "./route-loading";

vi.mock("@/presentation/hooks/t/client", () => ({
  useT: () => ({ t: (key: string) => key }),
}));

afterEach(cleanup);

describe("RouteLoading", () => {
  it("announces the loading state to assistive technology", () => {
    render(<RouteLoading>skeleton</RouteLoading>);

    expect(screen.getByRole("status")).toHaveTextContent("common.loading");
  });

  it("marks the skeleton as busy", () => {
    render(<RouteLoading>skeleton</RouteLoading>);

    expect(screen.getByText("skeleton")).toHaveAttribute("aria-busy", "true");
  });
});
