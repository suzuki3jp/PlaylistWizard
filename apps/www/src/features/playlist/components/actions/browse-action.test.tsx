import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ListMusic } from "lucide-react";
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

function renderBrowseAction(selected: Pick<Playlist, "id">[]) {
  return render(
    <SelectedPlaylistsContextProvider
      defaultSelectedPlaylists={selected as Playlist[]}
    >
      <BrowseAction
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

  it("clears the pending state once the navigation settles", async () => {
    renderBrowseAction([{ id: toPlaylistId("a") }]);
    const button = screen.getByRole("button", { name: "Browse" });

    fireEvent.click(button);

    await vi.waitFor(() => expect(button).not.toHaveAttribute("aria-busy"));
    expect(button).toBeEnabled();
  });
});
