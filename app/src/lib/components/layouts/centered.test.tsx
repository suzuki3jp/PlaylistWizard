import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CenteredLayout } from "./centered";

afterEach(cleanup);

describe("CenteredLayout", () => {
  it("renders children correctly", () => {
    render(
      <CenteredLayout direction="xy">
        <span>Test Content</span>
      </CenteredLayout>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies horizontal centering when direction is 'x'", () => {
    render(
      <CenteredLayout direction="x">
        <div data-testid="child">Content</div>
      </CenteredLayout>,
    );

    // コンテナーは縦横フルサイズ + 横中央揃え
    const container = screen.getByTestId("child").parentElement;
    expect(container).toHaveClass(
      "h-full",
      "w-full",
      "flex",
      "items-stretch",
      "justify-center",
    );
  });

  it("applies vertical centering when direction is 'y'", () => {
    render(
      <CenteredLayout direction="y">
        <div data-testid="child">Content</div>
      </CenteredLayout>,
    );

    const container = screen.getByTestId("child").parentElement;
    expect(container).toHaveClass(
      "h-full",
      "w-full",
      "flex",
      "flex-col",
      "justify-center",
      "items-stretch",
    );
  });

  it("applies both horizontal and vertical centering when direction is 'xy'", () => {
    render(
      <CenteredLayout direction="xy">
        <div data-testid="child">Content</div>
      </CenteredLayout>,
    );

    const container = screen.getByTestId("child").parentElement;
    expect(container).toHaveClass(
      "h-full",
      "w-full",
      "flex",
      "items-center",
      "justify-center",
    );
  });

  it("applies custom className when provided", () => {
    render(
      <CenteredLayout direction="xy" className="custom-class">
        <div data-testid="child">Content</div>
      </CenteredLayout>,
    );

    const container = screen.getByTestId("child").parentElement;
    expect(container).toHaveClass("custom-class");
  });

  it("renders multiple children correctly", () => {
    render(
      <CenteredLayout direction="xy">
        <span>First Child</span>
        <span>Second Child</span>
      </CenteredLayout>,
    );

    expect(screen.getByText("First Child")).toBeInTheDocument();
    expect(screen.getByText("Second Child")).toBeInTheDocument();
  });

  it("creates proper container structure", () => {
    render(
      <CenteredLayout direction="xy">
        <div data-testid="content">Test</div>
      </CenteredLayout>,
    );

    const content = screen.getByTestId("content");
    const container = content.parentElement; // CenteredLayoutのdiv

    // コンテナーは縦横マックス + 中央揃え設定
    expect(container).toHaveClass(
      "h-full",
      "w-full",
      "flex",
      "items-center",
      "justify-center",
    );
  });

  it("handles complex nested content", () => {
    render(
      <CenteredLayout direction="x" className="border">
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button type="button">Action</button>
        </div>
      </CenteredLayout>,
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();

    const container = screen.getByText("Title").closest("div")?.parentElement;
    expect(container).toHaveClass(
      "border",
      "flex",
      "items-stretch",
      "justify-center",
    );
  });

  it("preserves content layout inside centered container", () => {
    render(
      <CenteredLayout direction="y">
        <div data-testid="content-wrapper">
          <div data-testid="item1">Item 1</div>
          <div data-testid="item2">Item 2</div>
        </div>
      </CenteredLayout>,
    );

    // コンテンツは正しく配置されている
    expect(screen.getByTestId("content-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("item1")).toBeInTheDocument();
    expect(screen.getByTestId("item2")).toBeInTheDocument();
  });
});
