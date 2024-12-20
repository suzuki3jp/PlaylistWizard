"use client";
import {
	type Playlist,
	PlaylistManager,
	type UUID,
	generateUUID,
} from "@/actions";
import { NonUpperButton, WrappedDialog } from "@/components";
import { useT } from "@/hooks";
import {
	Search as BrowseIcon,
	ContentCopy as CopyIcon,
	Delete as DeleteIcon,
	CallMerge as MergeIcon,
	Shuffle as ShuffleIcon,
} from "@mui/icons-material";
import { Grid2 as Grid } from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import type React from "react";
import { useState } from "react";
import type { SetTaskFunc } from "./PlaylistManager";

export const PlaylistController: React.FC<PlaylistControllerProps> = ({
	selectedItems,
	setTask,
	refreshPlaylists,
}) => {
	const { t } = useT();
	const { data } = useSession();
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const oldQuery = useSearchParams();
	const router = useRouter();
	if (!data?.accessToken) return <></>;
	const manager = new PlaylistManager(data.accessToken);

	const updateTask = ({
		taskId,
		message,
		completed,
		total,
	}: {
		taskId: UUID;
		message?: string;
		completed?: number;
		total?: number;
	}) => {
		if (message || completed || total) {
			setTask(taskId, (prev) => {
				if (prev) {
					return {
						message: message ?? prev.message,
						completed: completed ?? prev.completed,
						total: total ?? prev.total,
					};
				}

				return {
					message: message ?? "DEFAULT MESSAGE",
					completed: completed ?? 0,
					total: total ?? 0,
				};
			});
		} else {
			setTask(taskId, () => null);
		}
	};

	const onCopyButtonClick = async () => {
		const copyTasks = selectedItems.map(async (playlist) => {
			const taskId = await generateUUID();
			updateTask({
				taskId,
				message: t("task-progress.copying-playlist", { title: playlist.title }),
			});

			const result = await manager.copy({
				sourceId: playlist.id,
				privacy: "unlisted",
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
			const message = result.isSuccess()
				? t("task-progress.succeed-to-copy-playlist", { title: playlist.title })
				: t("task-progress.failed-to-copy-playlist", {
						title: playlist.title,
						code: result.data.status,
					});
			showSnackbar(message, result.isSuccess());
		});

		await Promise.all(copyTasks);
		refreshPlaylists();
	};

	const onShuffleButtonClick = async () => {
		const shuffleTasks = selectedItems.map(async (playlist) => {
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
				onUpdatedPlaylistItemPosition: (i, oldI, newI, c, total) => {
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
			const message = result.isSuccess()
				? t("task-progress.succeed-to-shuffle-playlist", {
						title: playlist.title,
					})
				: t("task-progress.failed-to-shuffle-playlist", {
						title: playlist.title,
						code: result.data.status,
					});
			showSnackbar(message, result.isSuccess());
		});

		await Promise.all(shuffleTasks);
		refreshPlaylists();
	};

	const onMergeButtonClick = async () => {
		const taskId = await generateUUID();
		updateTask({
			taskId,
			message: t("task-progress.creating-new-playlist"),
		});

		const result = await manager.merge({
			sourceIds: selectedItems.map((p) => p.id),
			onAddedPlaylist: (p) => {
				updateTask({
					taskId,
					message: t("task-progress.created-playlist", { title: p.title }),
				});
			},
			onAddingPlaylistItem: (i) => {
				updateTask({
					taskId,
					message: t("task-progress.copying-playlist-item", { title: i.title }),
				});
			},
			onAddedPlaylistItem: (i, c, total) => {
				updateTask({
					taskId,
					message: t("task-progress.copied-playlist-item", { title: i.title }),
					completed: c,
					total,
				});
			},
		});

		updateTask({ taskId });
		const message = result.isSuccess()
			? t("task-progress.succeed-to-merge-playlist", {
					title: selectedItems.map((p) => p.title).join(", "),
				})
			: t("task-progress.failed-to-merge-playlist", {
					title: selectedItems.map((p) => p.title).join(", "),
					code: result.data.status,
				});
		showSnackbar(message, result.isSuccess());
		refreshPlaylists();
	};

	const onDeleteButtonClick = async () => setIsDeleteOpen(true);

	const onBrowseButtonClick = async () => {
		const newQuery = new URLSearchParams(oldQuery);
		const targetIds = selectedItems.slice(0, 3).map((p) => p.id);
		newQuery.set("id", targetIds.join(","));

		router.push(`?${newQuery.toString()}`);
	};

	return selectedItems.length === 0 ? (
		<></>
	) : (
		<Grid container spacing={1} size={12}>
			<Grid>
				<NonUpperButton
					variant="contained"
					startIcon={<CopyIcon />}
					onClick={onCopyButtonClick}
				>
					{t("button.copy")}
				</NonUpperButton>
			</Grid>
			<Grid>
				<NonUpperButton
					variant="contained"
					startIcon={<ShuffleIcon />}
					onClick={onShuffleButtonClick}
				>
					{t("button.shuffle")}
				</NonUpperButton>
			</Grid>
			<Grid>
				<NonUpperButton
					variant="contained"
					startIcon={<MergeIcon />}
					onClick={onMergeButtonClick}
				>
					{t("button.merge")}
				</NonUpperButton>
			</Grid>
			<Grid>
				<NonUpperButton
					variant="contained"
					startIcon={<DeleteIcon />}
					onClick={onDeleteButtonClick}
				>
					{t("button.delete")}
				</NonUpperButton>
			</Grid>
			<Grid>
				<NonUpperButton
					variant="contained"
					startIcon={<BrowseIcon />}
					onClick={onBrowseButtonClick}
				>
					{t("button.browse")}
				</NonUpperButton>
			</Grid>

			{/**
			 * DeleteDialog
			 */}
			<WrappedDialog
				open={isDeleteOpen}
				onClose={() => setIsDeleteOpen(false)}
				onConfirm={async () => {
					setIsDeleteOpen(false);
					const deleteTasks = selectedItems.map(async (playlist) => {
						const result = await manager.delete(playlist.id);
						const message = result.isSuccess()
							? t("task-progress.succeed-to-delete-playlist", {
									title: playlist.title,
								})
							: t("task-progress.failed-to-delete-playlist", {
									title: playlist.title,
									code: result.data.status,
								});
						showSnackbar(message);
					});

					await Promise.all(deleteTasks);
					refreshPlaylists();
				}}
				title={t("dialog.delete-title")}
				content={selectedItems.map((p) => p.title).join("\n")}
				isWarning
			/>
		</Grid>
	);
};

export type PlaylistControllerProps = Readonly<{
	selectedItems: Playlist[];
	setTask: SetTaskFunc;
	refreshPlaylists: () => void;
}>;

const showSnackbar = (message: string, isSuccess = true) => {
	enqueueSnackbar(message, { variant: isSuccess ? "success" : "error" });
};
