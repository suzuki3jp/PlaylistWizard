"use client";
import {
    Search as BrowseIcon,
    ContentCopy as CopyIcon,
    Delete as DeleteIcon,
    FilterAlt as ExtractIcon,
    CallMerge as MergeIcon,
    Shuffle as ShuffleIcon,
} from "@mui/icons-material";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import type React from "react";
import { useCallback, useState } from "react";

import { type FullPlaylist, PlaylistManager, generateUUID } from "@/actions";
import type {
    PlaylistState,
    UpdateTaskFunc,
} from "@/components/playlists-grid";
import { Button } from "@/components/shadcn-ui/button";
import { Checkbox } from "@/components/shadcn-ui/checkbox";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/shadcn-ui/dialog";
import { Label } from "@/components/shadcn-ui/label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/shadcn-ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { DEFAULT } from "@/constants";
import { useT } from "@/hooks";
import { providerToAdapterType } from "@/utils";
import MultipleSelector, { type Option } from "./shadcn-ui/multi-select";

/**
 * The PlaylistActions component in the PlaylistsGrid.
 * It will display the action buttons to perform on the selected playlists.
 * @returns
 */
export const PlaylistActions: React.FC<PlaylistActionsProps> = (props) => {
    return (
        <div className="col-span-full flex space-x-4">
            <CopyButton {...props} />
            <ShuffleButton {...props} />
            <MergeButton {...props} />
            <ExtractButton {...props} />
            <DeleteButton {...props} />
            <BrowseButton {...props} />
        </div>
    );
};

type PlaylistActionsProps = Readonly<{
    refreshPlaylists: () => Promise<void>;
    playlists: PlaylistState[];
    updateTask: UpdateTaskFunc;
}>;

type ButtonProps = PlaylistActionsProps & { updateTask: UpdateTaskFunc };

const CopyButton: React.FC<ButtonProps> = ({
    playlists,
    refreshPlaylists,
    updateTask,
}) => {
    const { t } = useT();
    const [isOpen, setIsOpen] = useState(false);
    const [targetId, setTargetId] = useState<string>(DEFAULT);
    const [allowDuplicates, setAllowDuplicates] = useState(false);

    const { data } = useSession();

    const handleCopy = async () => {
        setIsOpen(false);
        if (!data?.accessToken || !data?.provider) return;
        const isTargeted = targetId !== DEFAULT;
        const manager = new PlaylistManager(
            data.accessToken,
            providerToAdapterType(data.provider),
        );

        // If the target playlist is selected, copy the selected playlists to the target playlists.
        // Otherwise, copy the selected playlists to the new playlists.
        const copyTasks = playlists
            .filter((ps) => ps.isSelected)
            .map(async (ps) => {
                const playlist = ps.data;
                const taskId = await generateUUID();
                updateTask({
                    taskId,
                    message: t("task-progress.copying-playlist", {
                        title: playlist.title,
                    }),
                });
                const result = await manager.copy({
                    targetId: isTargeted ? targetId : undefined,
                    sourceId: playlist.id,
                    privacy: "unlisted",
                    allowDuplicates,
                    onAddedPlaylist: (p) => {
                        updateTask({
                            taskId,
                            message: t("task-progress.created-playlist", {
                                title: p.title,
                            }),
                        });
                    },
                    onAddingPlaylistItem: (i) => {
                        updateTask({
                            taskId,
                            message: t("task-progress.copying-playlist-item", {
                                title: i.title,
                            }),
                        });
                    },
                    onAddedPlaylistItem: (i, c, total) => {
                        updateTask({
                            taskId,
                            message: t("task-progress.copied-playlist-item", {
                                title: i.title,
                            }),
                            completed: c + 1,
                            total,
                        });
                    },
                });
                updateTask({ taskId });
                const message = result.isOk()
                    ? t("task-progress.succeed-to-copy-playlist", {
                          title: playlist.title,
                      })
                    : t("task-progress.failed-to-copy-playlist", {
                          title: playlist.title,
                          code: result.data.status,
                      });
                showSnackbar(message, result.isOk());
            });
        await Promise.all(copyTasks);
        refreshPlaylists();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <CopyIcon />
                    {t("your-playlists.actions.copy")}
                </Button>
            </DialogTrigger>
            <DialogContent>
                {/**
                 * The dialog header.
                 */}
                <DialogHeader>
                    <DialogTitle>
                        {t("your-playlists.action-modal.copy.title")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("your-playlists.action-modal.copy.description")}
                    </DialogDescription>
                </DialogHeader>

                {/**
                 * The dialog main content for the copy settings.
                 */}
                <Tooltip
                    content={t(
                        "your-playlists.action-modal.copy.target.description",
                    )}
                >
                    <p className="text-sm font-bold">
                        {t("your-playlists.action-modal.copy.target.title")}
                    </p>
                </Tooltip>
                <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger>
                        <SelectValue aria-label={targetId} />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectGroup>
                            {[
                                {
                                    data: {
                                        id: DEFAULT,
                                        title: t(
                                            "your-playlists.action-modal.create-new-playlist",
                                        ),
                                    },
                                    isSelected: false,
                                },
                                ...playlists,
                            ].map(({ data }) => (
                                <SelectItem key={data.id} value={data.id}>
                                    {data.title}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <div className="flex space-x-2">
                    <Checkbox
                        id="allow-duplicates"
                        checked={allowDuplicates}
                        onCheckedChange={(checked) =>
                            setAllowDuplicates(!!checked)
                        }
                    />
                    <Tooltip
                        content={t(
                            "your-playlists.action-modal.copy.allow-duplicates.description",
                        )}
                    >
                        <Label htmlFor="allow-duplicatess">
                            {t(
                                "your-playlists.action-modal.copy.allow-duplicates.title",
                            )}
                        </Label>
                    </Tooltip>
                </div>

                {/**
                 * The dialog footer.
                 */}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">
                            {t("your-playlists.action-modal.cancel")}
                        </Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleCopy}>
                        {t("your-playlists.action-modal.confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ShuffleButton: React.FC<ButtonProps> = ({
    playlists,
    refreshPlaylists,
    updateTask,
}) => {
    const { t } = useT();

    const { data } = useSession();
    if (!data?.accessToken || !data?.provider) return null;
    const manager = new PlaylistManager(
        data.accessToken,
        providerToAdapterType(data.provider),
    );

    const handleShuffle = async () => {
        const shuffleTasks = playlists
            .filter((ps) => ps.isSelected)
            .map(async (ps) => {
                const playlist = ps.data;
                const taskId = await generateUUID();
                updateTask({
                    taskId,
                    message: t("task-progress.shuffling-playlist", {
                        title: playlist.title,
                    }),
                });

                const result = await manager.shuffle({
                    targetId: playlist.id,
                    ratio: 0.4,
                    onUpdatingPlaylistItemPosition: (i, oldI, newI) => {
                        updateTask({
                            taskId,
                            message: t("task-progress.moving-playlist-item", {
                                title: i.title,
                                old: oldI,
                                new: newI,
                            }),
                        });
                    },
                    onUpdatedPlaylistItemPosition: (
                        i,
                        oldI,
                        newI,
                        c,
                        total,
                    ) => {
                        updateTask({
                            taskId,
                            message: t("task-progress.moved-playlist-item", {
                                title: i.title,
                                old: oldI,
                                new: newI,
                            }),
                            completed: c,
                            total,
                        });
                    },
                });

                updateTask({ taskId });
                const message = result.isOk()
                    ? t("task-progress.succeed-to-shuffle-playlist", {
                          title: playlist.title,
                      })
                    : t("task-progress.failed-to-shuffle-playlist", {
                          title: playlist.title,
                          code: result.data.status,
                      });
                showSnackbar(message, result.isOk());
            });

        await Promise.all(shuffleTasks);
        refreshPlaylists();
    };

    return (
        <Button onClick={handleShuffle}>
            <ShuffleIcon />
            {t("your-playlists.actions.shuffle")}
        </Button>
    );
};

const MergeButton: React.FC<ButtonProps> = ({
    playlists,
    updateTask,
    refreshPlaylists,
}) => {
    const { t } = useT();
    const [isOpen, setIsOpen] = useState(false);
    const [targetId, setTargetId] = useState<string>(DEFAULT);
    const [allowDuplicates, setAllowDuplicates] = useState(false);

    const { data } = useSession();

    const handleMerge = async () => {
        setIsOpen(false);
        if (!data?.accessToken || !data?.provider) return;
        const isTargeted = targetId !== DEFAULT;
        const manager = new PlaylistManager(
            data.accessToken,
            providerToAdapterType(data.provider),
        );

        const taskId = await generateUUID();
        updateTask({
            taskId,
            message: t("task-progress.creating-new-playlist"),
        });

        const result = await manager.merge({
            targetId: isTargeted ? targetId : undefined,
            sourceIds: playlists
                .filter((ps) => ps.isSelected)
                .map((ps) => ps.data.id),
            allowDuplicates,
            onAddedPlaylist: (p) => {
                updateTask({
                    taskId,
                    message: t("task-progress.created-playlist", {
                        title: p.title,
                    }),
                });
            },
            onAddingPlaylistItem: (i) => {
                updateTask({
                    taskId,
                    message: t("task-progress.copying-playlist-item", {
                        title: i.title,
                    }),
                });
            },
            onAddedPlaylistItem: (i, c, total) => {
                updateTask({
                    taskId,
                    message: t("task-progress.copied-playlist-item", {
                        title: i.title,
                    }),
                    completed: c,
                    total,
                });
            },
        });

        updateTask({ taskId });
        const message = result.isOk()
            ? t("task-progress.succeed-to-merge-playlist", {
                  title: playlists
                      .filter((ps) => ps.isSelected)
                      .map((ps) => ps.data.title)
                      .join(", "),
              })
            : t("task-progress.failed-to-merge-playlist", {
                  title: playlists
                      .filter((ps) => ps.isSelected)
                      .map((ps) => ps.data.title)
                      .join(", "),
                  code: result.data.status,
              });
        showSnackbar(message, result.isOk());
        refreshPlaylists();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <MergeIcon />
                    {t("your-playlists.actions.merge")}
                </Button>
            </DialogTrigger>
            <DialogContent>
                {/**
                 * The dialog header.
                 */}
                <DialogHeader>
                    <DialogTitle>
                        {t("your-playlists.action-modal.merge.title")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("your-playlists.action-modal.merge.description")}
                    </DialogDescription>
                </DialogHeader>

                {/**
                 * The dialog main content for the merge settings.
                 */}
                <Tooltip
                    content={t(
                        "your-playlists.action-modal.merge.target.description",
                    )}
                >
                    <p className="text-sm font-bold">
                        {t("your-playlists.action-modal.merge.target.title")}
                    </p>
                </Tooltip>
                <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger>
                        <SelectValue aria-label={targetId} />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectGroup>
                            {[
                                {
                                    data: {
                                        id: DEFAULT,
                                        title: t(
                                            "your-playlists.action-modal.create-new-playlist",
                                        ),
                                    },
                                    isSelected: false,
                                },
                                ...playlists,
                            ].map(({ data }) => (
                                <SelectItem key={data.id} value={data.id}>
                                    {data.title}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <div className="flex space-x-2">
                    <Checkbox
                        id="allow-duplicates"
                        checked={allowDuplicates}
                        onCheckedChange={(checked) =>
                            setAllowDuplicates(!!checked)
                        }
                    />
                    <Tooltip
                        content={t(
                            "your-playlists.action-modal.merge.allow-duplicates.description",
                        )}
                    >
                        <Label htmlFor="allow-duplicatess">
                            {t(
                                "your-playlists.action-modal.merge.allow-duplicates.title",
                            )}
                        </Label>
                    </Tooltip>
                </div>

                {/**
                 * The dialog footer.
                 */}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">
                            {t("your-playlists.action-modal.cancel")}
                        </Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleMerge}>
                        {t("your-playlists.action-modal.confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ExtractButton: React.FC<ButtonProps> = ({
    playlists,
    updateTask,
    refreshPlaylists,
}) => {
    const { data } = useSession();
    const { t } = useT();
    const [isOpen, setIsOpen] = useState(false);
    const [targetId, setTargetId] = useState<string>(DEFAULT);
    const [allowDuplicates, setAllowDuplicates] = useState(false);

    const [artists, setArtists] = useState<string[]>([]);
    const [artistMultiOptions, setArtistMultiOptions] = useState<Option[]>([]);
    const [selectedArtists, setSelectedArtists] = useState<Option[]>([]);
    const refreshItems = useCallback(
        async (ids: string[]) => {
            if (!data?.accessToken || !data?.provider) return;
            const itemsPromises = ids.map(async (id) => {
                const manager = new PlaylistManager(
                    data.accessToken as string,
                    providerToAdapterType(
                        data.provider as "google" | "spotify",
                    ),
                );
                const result = await manager.getFullPlaylist(id);
                if (result.isErr())
                    return {
                        id: "",
                        title: "",
                        items: [],
                        itemsTotal: 0,
                        thumbnail: "",
                        url: "",
                    } as FullPlaylist;
                return result.data;
            });
            const items = await Promise.all(itemsPromises);
            const artists = items
                .flatMap((i) => i.items)
                .map((i) => i.author)
                .filter((a, i, self) => self.indexOf(a) === i);
            setArtists(artists);
            function convertArtistsToOptions(artists: string[]): Option[] {
                return artists.map((artist) => {
                    return {
                        label: artist,
                        value: artist,
                    };
                });
            }
            setArtistMultiOptions(convertArtistsToOptions(artists));
        },
        [data],
    );

    async function handleOnOpen(open: boolean) {
        if (open) {
            await refreshItems(
                playlists.filter((p) => p.isSelected).map((p) => p.data.id),
            );
        }

        setIsOpen(open);
    }

    const handleExtract = async () => {
        setIsOpen(false);
        if (!data?.accessToken || !data?.provider) return;
        const isTargeted = targetId !== DEFAULT;
        const manager = new PlaylistManager(
            data.accessToken,
            providerToAdapterType(data.provider),
        );

        const taskId = await generateUUID();
        updateTask({
            taskId,
            message: t("task-progress.creating-new-playlist"),
        });

        const result = await manager.extract({
            targetId: isTargeted ? targetId : undefined,
            sourceIds: playlists
                .filter((ps) => ps.isSelected)
                .map((ps) => ps.data.id),
            extractArtists: selectedArtists.map((o) => o.value),
            allowDuplicates,
            onAddedPlaylist: (p) => {
                updateTask({
                    taskId,
                    message: t("task-progress.created-playlist", {
                        title: p.title,
                    }),
                });
            },
            onAddingPlaylistItem: (i) => {
                updateTask({
                    taskId,
                    message: t("task-progress.copying-playlist-item", {
                        title: i.title,
                    }),
                });
            },
            onAddedPlaylistItem: (i, c, total) => {
                updateTask({
                    taskId,
                    message: t("task-progress.copied-playlist-item", {
                        title: i.title,
                    }),
                    completed: c,
                    total,
                });
            },
        });

        updateTask({ taskId });
        const message = result.isOk()
            ? t("task-progress.succeed-to-extract-playlist", {
                  title: playlists
                      .filter((ps) => ps.isSelected)
                      .map((ps) => ps.data.title)
                      .join(", "),
              })
            : t("task-progress.failed-to-extract-playlist", {
                  title: playlists
                      .filter((ps) => ps.isSelected)
                      .map((ps) => ps.data.title)
                      .join(", "),
                  code: result.data.status,
              });
        showSnackbar(message, result.isOk());
        refreshPlaylists();
    };
    return (
        <Dialog open={isOpen} onOpenChange={handleOnOpen}>
            <DialogTrigger asChild>
                <Button>
                    <ExtractIcon />
                    {t("your-playlists.actions.extract")}
                </Button>
            </DialogTrigger>
            <DialogContent>
                {/**
                 * The dialog header.
                 */}
                <DialogHeader>
                    <DialogTitle>
                        {t("your-playlists.action-modal.extract.title")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("your-playlists.action-modal.extract.description")}
                    </DialogDescription>
                </DialogHeader>

                {/**
                 * The dialog main content for the extract settings.
                 */}
                <Tooltip
                    content={t(
                        "your-playlists.action-modal.extract.target.description",
                    )}
                >
                    <p className="text-sm font-bold">
                        {t("your-playlists.action-modal.extract.target.title")}
                    </p>
                </Tooltip>
                <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger>
                        <SelectValue aria-label={targetId} />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectGroup>
                            {[
                                {
                                    data: {
                                        id: DEFAULT,
                                        title: t(
                                            "your-playlists.action-modal.create-new-playlist",
                                        ),
                                    },
                                    isSelected: false,
                                },
                                ...playlists,
                            ].map(({ data }) => (
                                <SelectItem key={data.id} value={data.id}>
                                    {data.title}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                <Tooltip
                    content={t(
                        "your-playlists.action-modal.extract.artist.description",
                    )}
                >
                    <Label htmlFor="allow-duplicatess">
                        {t("your-playlists.action-modal.extract.artist.title")}
                    </Label>
                </Tooltip>
                <MultipleSelector
                    value={selectedArtists}
                    onChange={setSelectedArtists}
                    defaultOptions={artistMultiOptions}
                    placeholder={t(
                        "your-playlists.action-modal.extract.artist.placeholder",
                    )}
                />
                <div className="flex space-x-2">
                    <Checkbox
                        id="allow-duplicates"
                        checked={allowDuplicates}
                        onCheckedChange={(checked) =>
                            setAllowDuplicates(!!checked)
                        }
                    />
                    <Tooltip
                        content={t(
                            "your-playlists.action-modal.extract.allow-duplicates.description",
                        )}
                    >
                        <Label htmlFor="allow-duplicatess">
                            {t(
                                "your-playlists.action-modal.extract.allow-duplicates.title",
                            )}
                        </Label>
                    </Tooltip>
                </div>

                {/**
                 * The dialog footer.
                 */}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">
                            {t("your-playlists.action-modal.cancel")}
                        </Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleExtract}>
                        {t("your-playlists.action-modal.confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const DeleteButton: React.FC<ButtonProps> = ({
    playlists,
    refreshPlaylists,
}) => {
    const { t } = useT();
    const [isOpen, setIsOpen] = useState(false);

    const { data } = useSession();

    const handleDelete = async () => {
        setIsOpen(false);
        if (!data?.accessToken || !data?.provider) return;
        const manager = new PlaylistManager(
            data.accessToken,
            providerToAdapterType(data.provider),
        );

        const deleteTasks = playlists
            .filter((ps) => ps.isSelected)
            .map(async (ps) => {
                const playlist = ps.data;
                const result = await manager.delete(playlist.id);
                const message = result.isOk()
                    ? t("task-progress.succeed-to-delete-playlist", {
                          title: playlist.title,
                      })
                    : t("task-progress.failed-to-delete-playlist", {
                          title: playlist.title,
                          code: result.data.status,
                      });
                showSnackbar(message, result.isOk());
            });

        await Promise.all(deleteTasks);
        refreshPlaylists();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <DeleteIcon />
                    {t("your-playlists.actions.delete")}
                </Button>
            </DialogTrigger>
            <DialogContent>
                {/**
                 * The dialog header.
                 */}
                <DialogHeader>
                    <DialogTitle>
                        {t("your-playlists.action-modal.delete.title")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("your-playlists.action-modal.delete.description")}
                    </DialogDescription>
                </DialogHeader>

                {/**
                 * The dialog footer.
                 */}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">
                            {t("your-playlists.action-modal.cancel")}
                        </Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        variant="destructive"
                        onClick={handleDelete}
                    >
                        {t("your-playlists.action-modal.confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const BrowseButton: React.FC<ButtonProps> = ({ playlists }) => {
    const { t } = useT();
    const oldQuery = useSearchParams();
    const router = useRouter();

    const handleBrowse = () => {
        const newQuery = new URLSearchParams(oldQuery);
        const targetIds = playlists
            .filter((ps) => ps.isSelected)
            .map((ps) => ps.data.id);
        newQuery.set("id", targetIds.join(","));

        router.push(`?${newQuery.toString()}`);
    };

    return (
        <Button onClick={handleBrowse}>
            <BrowseIcon />
            {t("your-playlists.actions.browse")}
        </Button>
    );
};

const showSnackbar = (message: string, isSuccess = true) => {
    enqueueSnackbar(message, { variant: isSuccess ? "success" : "error" });
};
