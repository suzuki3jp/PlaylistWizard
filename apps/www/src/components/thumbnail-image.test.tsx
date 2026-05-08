import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { urls } from "@/constants";
import type { Thumbnail } from "@/entities/thumbnail";
import { ThumbnailImage } from "./thumbnail-image";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => (
    // biome-ignore lint/performance/noImgElement: This is a mock for testing purposes
    <img src={src} alt={alt} data-testid="thumbnail-image" {...props} />
  ),
}));

afterEach(cleanup);

const sampleThumbnails: Thumbnail[] = [
  { url: "https://example.com/default.jpg", width: 120, height: 90 },
  { url: "https://example.com/medium.jpg", width: 320, height: 180 },
  { url: "https://example.com/high.jpg", width: 480, height: 360 },
];

describe("ThumbnailImage", () => {
  it("renders with fallback image when thumbnails is empty", () => {
    render(<ThumbnailImage thumbnails={[]} targetWidth={320} alt="test" />);
    const img = screen.getByTestId("thumbnail-image");
    expect(img).toHaveAttribute("src", "/assets/ogp.png");
  });

  it("selects the smallest thumbnail wider than targetWidth", () => {
    render(
      <ThumbnailImage
        thumbnails={sampleThumbnails}
        targetWidth={300}
        alt="test"
      />,
    );
    const img = screen.getByTestId("thumbnail-image");
    // 320 is the smallest width greater than or equal to 300.
    expect(img).toHaveAttribute("src", "https://example.com/medium.jpg");
  });

  it("selects the smallest thumbnail when targetWidth is very small", () => {
    render(
      <ThumbnailImage
        thumbnails={sampleThumbnails}
        targetWidth={50}
        alt="test"
      />,
    );
    const img = screen.getByTestId("thumbnail-image");
    expect(img).toHaveAttribute("src", "https://example.com/default.jpg");
  });

  it("selects the largest thumbnail when targetWidth is very large", () => {
    render(
      <ThumbnailImage
        thumbnails={sampleThumbnails}
        targetWidth={1000}
        alt="test"
      />,
    );
    const img = screen.getByTestId("thumbnail-image");
    expect(img).toHaveAttribute("src", "https://example.com/high.jpg");
  });

  it("renders with proxy URL when selected thumbnail is YouTube no thumbnail URL", () => {
    const thumbnails: Thumbnail[] = [
      { url: urls.youtubeApiNoThumbnail(), width: 120, height: 90 },
    ];
    render(
      <ThumbnailImage thumbnails={thumbnails} targetWidth={120} alt="test" />,
    );
    const img = screen.getByTestId("thumbnail-image");
    expect(img).toHaveAttribute("src", urls.youtubeNoThumbnailProxy());
  });

  it("passes alt attribute correctly", () => {
    render(
      <ThumbnailImage
        thumbnails={sampleThumbnails}
        targetWidth={320}
        alt="Test Alt"
      />,
    );
    const img = screen.getByTestId("thumbnail-image");
    expect(img).toHaveAttribute("alt", "Test Alt");
  });

  it("passes additional props to Image component", () => {
    render(
      <ThumbnailImage
        thumbnails={sampleThumbnails}
        targetWidth={320}
        alt="test"
        className="custom-class"
        width={100}
        height={100}
      />,
    );
    const img = screen.getByTestId("thumbnail-image");
    expect(img).toHaveClass("custom-class");
    expect(img).toHaveAttribute("width", "100");
    expect(img).toHaveAttribute("height", "100");
  });
});
