import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FadeInUpAnimation } from "./fade-in-up";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, className, ...props }) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    )),
  },
}));

afterEach(cleanup);

describe("FadeInUpAnimation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children correctly", () => {
    render(
      <FadeInUpAnimation>
        <span>Test Content</span>
      </FadeInUpAnimation>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies className when provided", () => {
    render(
      <FadeInUpAnimation className="custom-class">
        <span>Test Content</span>
      </FadeInUpAnimation>,
    );

    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toHaveClass("custom-class");
  });

  it("renders without className when not provided", () => {
    render(
      <FadeInUpAnimation>
        <span>Test Content</span>
      </FadeInUpAnimation>,
    );

    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).not.toHaveClass();
  });

  it("passes correct animation props to motion component", () => {
    // より具体的なモックでアニメーションプロパティをテスト
    const mockMotionDiv = vi.fn(
      ({ children, initial, animate, transition, ...props }) => (
        <div
          data-testid="motion-div"
          data-initial={JSON.stringify(initial)}
          data-animate={JSON.stringify(animate)}
          data-transition={JSON.stringify(transition)}
          {...props}
        >
          {children}
        </div>
      ),
    );

    vi.doMock("framer-motion", () => ({
      motion: {
        div: mockMotionDiv,
      },
    }));

    render(
      <FadeInUpAnimation delay={0.5}>
        <span>Test Content</span>
      </FadeInUpAnimation>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();

    // アニメーションプロパティが正しく設定されているかテスト
    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv.dataset.initial).toBe('{"opacity":0,"y":20}');
    expect(motionDiv.dataset.animate).toBe('{"opacity":1,"y":0}');
    expect(motionDiv.dataset.transition).toBe('{"duration":0.6,"delay":0.5}');
  });

  it("renders with multiple children", () => {
    render(
      <FadeInUpAnimation>
        <span>First Child</span>
        <span>Second Child</span>
      </FadeInUpAnimation>,
    );

    expect(screen.getByText("First Child")).toBeInTheDocument();
    expect(screen.getByText("Second Child")).toBeInTheDocument();
  });

  it("works with complex child components", () => {
    render(
      <FadeInUpAnimation className="wrapper">
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button type="button">Action</button>
        </div>
      </FadeInUpAnimation>,
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByTestId("motion-div")).toHaveClass("wrapper");
  });

  it("handles undefined delay gracefully", () => {
    render(
      <FadeInUpAnimation delay={undefined}>
        <span>Test Content</span>
      </FadeInUpAnimation>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });
});
