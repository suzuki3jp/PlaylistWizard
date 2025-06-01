import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Text, Title } from "./typography";

describe("Text", () => {
  it("renders children correctly", () => {
    render(<Text>Sample Text</Text>);
    expect(screen.getByText("Sample Text")).toBeInTheDocument();
  });

  it("applies the default classes", () => {
    render(<Text>Styled Text</Text>);
    const p = screen.getByText("Styled Text");
    expect(p).toHaveClass("laedin-relaxed");
    expect(p).toHaveClass("text-gray-300");
  });

  it("appends custom className", () => {
    render(<Text className="custom-class">Custom Class</Text>);
    const p = screen.getByText("Custom Class");
    expect(p).toHaveClass("custom-class");
  });
});

describe("Title", () => {
  it("renders children correctly", () => {
    render(<Title>Page Title</Title>);
    expect(screen.getByText("Page Title")).toBeInTheDocument();
  });

  it("renders as an h1 element", () => {
    render(<Title>Heading</Title>);
    const h1 = screen.getByText("Heading");
    expect(h1.tagName).toBe("H1");
  });

  it("applies the correct classes", () => {
    render(<Title>Styled Title</Title>);
    const h1 = screen.getByText("Styled Title");
    expect(h1).toHaveClass("font-bold");
    expect(h1).toHaveClass("text-4xl");
    expect(h1).toHaveClass("text-white");
  });
});
