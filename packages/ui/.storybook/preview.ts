import type { Preview } from "@storybook/react-vite";
import { createElement } from "react";
import "./preview.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "app",
      values: [
        { name: "app", value: "oklch(0.145 0 0)" },
        { name: "light", value: "oklch(1 0 0)" },
      ],
    },
    layout: "centered",
  },
  decorators: [
    (Story) =>
      createElement(
        "div",
        {
          className:
            "dark min-h-[240px] min-w-[320px] bg-background p-6 text-foreground",
        },
        createElement(Story),
      ),
  ],
};

export default preview;
