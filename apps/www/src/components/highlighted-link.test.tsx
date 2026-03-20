import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HighlightedLink } from "./highlighted-link";

describe("HighlightedLink", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the link with the provided text", () => {
    render(<HighlightedLink href="/test">Test Link</HighlightedLink>);
    expect(screen.getByText("Test Link")).toBeInTheDocument();
  });

  it("renders the link with the correct href", () => {
    render(<HighlightedLink href="/test">Test Link</HighlightedLink>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/test");
  });

  it("applies custom className if provided", () => {
    render(
      <HighlightedLink href="/test" className="custom-class">
        Test Link
      </HighlightedLink>,
    );
    expect(screen.getByRole("link")).toHaveClass(
      "custom-class text-pink-400 hover:text-pink-300 underline",
    );
  });

  it("renders children correctly", () => {
    render(
      <HighlightedLink href="/test">
        <span>Child Element</span>
      </HighlightedLink>,
    );
    expect(screen.getByText("Child Element")).toBeInTheDocument();
  });
});
