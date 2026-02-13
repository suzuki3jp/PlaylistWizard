import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { urls } from "@/constants";
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

describe("ThumbnailImage", () => {
  it("renders with fallback image when src is undefined", () => {
    render(<ThumbnailImage src={undefined} alt="test" />);
    const img = screen.getByTestId("thumbnail-image");
    expect(img).toHaveAttribute("src", "/assets/ogp.png");
  });

  it("renders with fallback image when src is empty string", () => {
    render(<ThumbnailImage src="" alt="test" />);
    const img = screen.getByTestId("thumbnail-image");
    expect(img).toHaveAttribute("src", "/assets/ogp.png");
  });

  it("renders with proxy URL when src is YouTube no thumbnail URL", () => {
    render(<ThumbnailImage src={urls.youtubeApiNoThumbnail()} alt="test" />);
    const img = screen.getByTestId("thumbnail-image");
    expect(img).toHaveAttribute("src", urls.youtubeNoThumbnailProxy());
  });

  it("renders with original src when src is a normal URL", () => {
    const normalUrl = "https://example.com/thumbnail.jpg";
    render(<ThumbnailImage src={normalUrl} alt="test" />);
    const img = screen.getByTestId("thumbnail-image");
    expect(img).toHaveAttribute("src", normalUrl);
  });

  it("passes alt attribute correctly", () => {
    render(<ThumbnailImage src="https://example.com/img.jpg" alt="Test Alt" />);
    const img = screen.getByTestId("thumbnail-image");
    expect(img).toHaveAttribute("alt", "Test Alt");
  });

  it("passes additional props to Image component", () => {
    render(
      <ThumbnailImage
        src="https://example.com/img.jpg"
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
