import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Link } from "./link";

afterEach(cleanup);

describe("Link", () => {
  it("renders children", () => {
    render(<Link href="/test">Test Link</Link>);
    expect(screen.getByText("Test Link")).toBeInTheDocument();
  });

  it("renders with underline class when underline prop is true", () => {
    render(
      <Link href="/test" underline>
        Underlined Link
      </Link>,
    );
    const link = screen.getByText("Underlined Link");
    expect(link).toHaveClass("underline");
  });

  it("does not render underline class when underline prop is false", () => {
    render(
      <Link href="/test" underline={false}>
        No Underline
      </Link>,
    );
    const link = screen.getByText("No Underline");
    expect(link).not.toHaveClass("underline");
  });

  it("applies custom className", () => {
    render(
      <Link href="/test" className="custom-class">
        Custom Class
      </Link>,
    );
    const link = screen.getByText("Custom Class");
    expect(link).toHaveClass("custom-class");
  });

  it("combines custom className and underline", () => {
    render(
      <Link href="/test" className="custom-class" underline>
        Combined Classes
      </Link>,
    );
    const link = screen.getByText("Combined Classes");
    expect(link).toHaveClass("custom-class");
    expect(link).toHaveClass("underline");
  });

  it("sets target to _blank when openInNewTab is true", () => {
    render(
      <Link href="/test" openInNewTab>
        New Tab Link
      </Link>,
    );
    const link = screen.getByText("New Tab Link");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("does not set target when openInNewTab is false", () => {
    render(
      <Link href="/test" openInNewTab={false}>
        Same Tab Link
      </Link>,
    );
    const link = screen.getByText("Same Tab Link");
    expect(link).not.toHaveAttribute("target");
  });

  it("passes other props to NextLink", () => {
    render(
      <Link href="/test" aria-label="test-link">
        ARIA Link
      </Link>,
    );
    const link = screen.getByLabelText("test-link");
    expect(link).toBeInTheDocument();
  });
});
