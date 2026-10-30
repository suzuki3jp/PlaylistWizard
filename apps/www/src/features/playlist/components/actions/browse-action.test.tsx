import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { ListMusic } from "lucide-react";
import { Suspense, use, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toPlaylistId } from "@/entities/ids";
import type { Playlist } from "@/features/playlist/entities";
import { SelectedPlaylistsContextProvider } from "../../contexts/selected-playlists";
import { BrowseAction } from "./browse-action";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/common/emit-ga4-event", () => ({
  emitGa4Event: vi.fn(),
}));

afterEach(() => {
  cleanup();
  push.mockReset();
});

let startNavigation: (() => void) | undefined;

/**
 * Stands in for the App Router: once `startNavigation` is called inside a
 * transition, it suspends until `navigation` resolves, keeping the transition
 * pending the way a real `router.push` does while the next page loads.
 */
function PendingNavigation({ navigation }: { navigation: Promise<void> }) {
  const [navigating, setNavigating] = useState(false);
  startNavigation = () => setNavigating(true);
  if (navigating) use(navigation);
  return null;
}

function renderBrowseAction(
  selected: Pick<Playlist, "id">[],
  navigation: Promise<void> = new Promise(() => {}),
) {
  return render(
    <SelectedPlaylistsContextProvider
      // BrowseAction only reads `id` from the selected playlists.
      defaultSelectedPlaylists={selected as Playlist[]}
    >
      <Suspense fallback={null}>
        <PendingNavigation navigation={navigation} />
      </Suspense>
      <BrowseAction
        // BrowseAction does not translate anything, so `t` is never called.
        t={((key: string) => key) as never}
        icon={ListMusic}
        label="Browse"
        disabled={false}
      />
    </SelectedPlaylistsContextProvider>,
  );
}

describe("BrowseAction", () => {
  it("navigates to the browser for the selected playlists", () => {
    renderBrowseAction([{ id: toPlaylistId("a") }, { id: toPlaylistId("b") }]);

    fireEvent.click(screen.getByRole("button", { name: "Browse" }));

    expect(push).toHaveBeenCalledWith("/playlists/browser?ids=a,b");
  });

  it("shows a pending state until the navigation settles", async () => {
    let finishNavigation!: () => void;
    const navigation = new Promise<void>((resolve) => {
      finishNavigation = resolve;
    });
    push.mockImplementation(() => startNavigation?.());
    renderBrowseAction([{ id: toPlaylistId("a") }], navigation);
    const button = screen.getByRole("button", { name: "Browse" });

    await act(async () => fireEvent.click(button));
    await vi.waitFor(() => expect(button).toHaveAttribute("aria-busy", "true"));
    expect(button).toBeDisabled();

    await act(async () => finishNavigation());
    await vi.waitFor(() => expect(button).not.toHaveAttribute("aria-busy"));
    expect(button).toBeEnabled();
  });
});
