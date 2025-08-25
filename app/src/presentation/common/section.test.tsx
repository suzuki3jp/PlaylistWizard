import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Section, SectionSecondaryTitle, SectionTitle } from "./section";

describe("SectionTitle", () => {
  it("renders children inside an h2 with correct classes", () => {
    render(<SectionTitle>Test Title</SectionTitle>);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Test Title");
    expect(heading).toHaveClass("font-bold", "text-2xl", "text-white");
  });
});

describe("SectionSecondaryTitle", () => {
  it("renders children inside an h3 with correct classes", () => {
    render(<SectionSecondaryTitle>Secondary Title</SectionSecondaryTitle>);
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent("Secondary Title");
    expect(heading).toHaveClass("font-semibold", "text-pink-400", "text-xl");
  });
});

describe("Section", () => {
  it("renders children inside a section with correct classes", () => {
    render(
      <Section aria-label="Test Section">
        <div>Child 1</div>
        <div>Child 2</div>
      </Section>,
    );

    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
  });
});
