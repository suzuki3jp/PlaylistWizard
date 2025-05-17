"use client";
import { useState } from "react";

import { PlaylistManager } from "@/actions/playlist-manager";
import type { PlaylistActionProps } from "@/components/playlists/playlists-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEFAULT } from "@/constants";
import { providerToAdapterType } from "@/helpers/providerToAdapterType";
import { sleep } from "@/helpers/sleep";
import { useAuth } from "@/hooks/useAuth";
import { Copy, HelpCircle } from "lucide-react";

export function CopyButton({
    t,
    playlists,
    refreshPlaylists,
    createTask,
    updateTaskMessage,
    updateTaskProgress,
    updateTaskStatus,
    removeTask,
}: PlaylistActionProps) {
    const auth = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [targetId, setTargetId] = useState<string>(DEFAULT);
    const [allowDuplicates, setAllowDuplicates] = useState(false);

    if (!auth) return null;
    const handleCopy = async () => {
        setIsOpen(false);
        const isTargeted = targetId !== DEFAULT;
        const manager = new PlaylistManager(
            auth.accessToken,
            providerToAdapterType(auth.provider),
        );

        // If the target playlist is selected, copy the selected playlists to the target playlists.
        // Otherwise, copy the selected playlists to the new playlists.
        const copyTasks = playlists
            .filter((ps) => ps.isSelected)
            .map(async (ps) => {
                const playlist = ps.data;
                const taskId = await createTask(
                    "copy",
                    t("task-progress.copying-playlist", {
                        title: playlist.title,
                    }),
                );
                const result = await manager.copy({
                    targetId: isTargeted ? targetId : undefined,
                    sourceId: playlist.id,
                    privacy: "unlisted",
                    allowDuplicates,
                    onAddedPlaylist: (p) => {
                        updateTaskMessage(
                            taskId,
                            t("task-progress.created-playlist", {
                                title: p.title,
                            }),
                        );
                    },
                    onAddingPlaylistItem: (i) => {
                        updateTaskMessage(
                            taskId,
                            t("task-progress.copying-playlist-item", {
                                title: i.title,
                            }),
                        );
                    },
                    onAddedPlaylistItem: (i, c, total) => {
                        updateTaskMessage(
                            taskId,
                            t("task-progress.copied-playlist-item", {
                                title: i.title,
                            }),
                        );
                        updateTaskProgress(taskId, (c / total) * 100);
                    },
                });

                const message = result.isOk()
                    ? t("task-progress.succeed-to-copy-playlist", {
                          title: playlist.title,
                      })
                    : t("task-progress.failed-to-copy-playlist", {
                          title: playlist.title,
                          code: result.error.status,
                      });

                if (result.isOk()) {
                    updateTaskProgress(taskId, 100);
                    updateTaskStatus(taskId, "completed");
                    updateTaskMessage(taskId, message);
                } else {
                    updateTaskStatus(taskId, "error");
                    updateTaskMessage(taskId, message);
                }

                await sleep(2000);
                removeTask(taskId);
            });
        await Promise.all(copyTasks);
        refreshPlaylists();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                    disabled={
                        playlists.filter((p) => p.isSelected).length === 0
                    }
                >
                    <Copy className="mr-2 h-4 w-4" />
                    {t("playlists.copy")}
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border border-gray-800 text-white sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="rounded-full bg-pink-600 p-1.5">
                            <Copy className="h-4 w-4 text-white" />
                        </div>
                        <DialogTitle className="text-xl">
                            {t("action-modal.copy.title")}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-400">
                        {t("action-modal.copy.description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                            <label className="text-sm font-medium text-white">
                                {t("action-modal.common.target.title")}
                            </label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                        >
                                            <HelpCircle className="h-4 w-4" />
                                            <span className="sr-only">
                                                {t("action-modal.common.help")}
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                        <p>
                                            {t(
                                                "action-modal.common.target.description",
                                            )}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Select value={targetId} onValueChange={setTargetId}>
                            <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white focus:ring-pink-500">
                                <SelectValue aria-label={targetId} />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                <SelectGroup>
                                    <SelectItem
                                        value={DEFAULT}
                                        className="focus:bg-pink-600"
                                    >
                                        {t(
                                            "action-modal.common.create-new-playlist",
                                        )}
                                    </SelectItem>
                                    <SelectLabel className="text-gray-400">
                                        {t(
                                            "action-modal.common.existing-playlists",
                                        )}
                                    </SelectLabel>
                                    {playlists.map((playlist) => (
                                        <SelectItem
                                            key={playlist.data.id}
                                            value={playlist.data.id}
                                            className="focus:bg-pink-600"
                                        >
                                            {playlist.data.title}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="allowDuplicates"
                            checked={allowDuplicates}
                            onCheckedChange={(checked) =>
                                setAllowDuplicates(checked as boolean)
                            }
                            className="border-gray-600 bg-gray-800 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600 shadow-[0_0_3px_rgba(255,255,255,0.4)] hover:shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                        />
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="allowDuplicates"
                                className="text-sm font-medium text-white cursor-pointer"
                            >
                                {t(
                                    "action-modal.common.allow-duplicates.title",
                                )}
                            </label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                        >
                                            <HelpCircle className="h-4 w-4" />
                                            <span className="sr-only">
                                                {t("action-modal.common.help")}
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                        <p>
                                            {t(
                                                "action-modal.common.allow-duplicates.description",
                                            )}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex sm:justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                    >
                        {t("action-modal.common.cancel")}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleCopy}
                        className="bg-pink-600 hover:bg-pink-700 text-white"
                    >
                        {t("action-modal.common.confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
