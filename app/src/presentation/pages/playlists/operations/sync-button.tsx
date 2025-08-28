"use client";
import type { TFunction } from "i18next";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Play,
  RefreshCw as SyncIcon,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import { sleep } from "@/common/sleep";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Button } from "@/presentation/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/presentation/shadcn/dialog";
import { deserialize } from "@/repository/structured-playlists";
import { StructuredPlaylistsDefinitionDeserializeErrorCode } from "@/repository/structured-playlists/deserialize";
import type { StructuredPlaylistsDefinition } from "@/repository/structured-playlists/schema";
import { JobsBuilder } from "@/usecase/command/jobs";
import { AddPlaylistItemJob } from "@/usecase/command/jobs/add-playlist-item";
import { SyncStructuredPlaylistsUsecase } from "@/usecase/sync-structured-playlists";
import { useTask } from "../contexts";
import { useHistory } from "../history";

export function SyncButton() {
  const { t } = useT("operation");
  const { t: commonT } = useT();
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const {
    dispatchers: {
      createTask,
      updateTaskMessage,
      updateTaskProgress,
      updateTaskStatus,
      removeTask,
    },
  } = useTask();
  const history = useHistory();

  // State for file handling
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [structureData, setStructureData] =
    useState<StructuredPlaylistsDefinition | null>(null);

  async function handleSync() {
    if (!window.confirm(commonT("beta-confirm"))) return;

    setIsOpen(false);
    clearFile();
    if (!auth || !structureData) return;

    const jobs = new JobsBuilder();
    const taskId = await createTask("sync", t("sync.progress.preparing"));

    const result = await new SyncStructuredPlaylistsUsecase({
      accessToken: auth.accessToken,
      repository: auth.provider,
      definitionJson: structureData,
      onExecutingSyncStep: (step) => {
        updateTaskMessage(
          taskId,
          t("sync.progress.adding", { item: step.item.title }),
        );
      },
      onExecutedSyncStep: (step, current, total) => {
        updateTaskProgress(taskId, (current / total) * 100);
        updateTaskMessage(
          taskId,
          t("sync.progress.added", { item: step.item.title }),
        );
        jobs.addJob(
          new AddPlaylistItemJob({
            accessToken: auth.accessToken,
            provider: auth.provider,
            playlistId: step.playlistId,
            itemId: step.item.id,
          }),
        );
      },
    }).execute();

    const message = result.isOk()
      ? t("sync.progress.success")
      : t("sync.progress.failure", {
          error: `${result.error.type.toUpperCase()}: ${result.error.message}`,
        });

    if (result.isOk()) {
      updateTaskProgress(taskId, 100);
      updateTaskStatus(taskId, "completed");
      updateTaskMessage(taskId, message);
    } else {
      updateTaskStatus(taskId, "error");
      updateTaskMessage(taskId, message);
    }

    history.addCommand(jobs.toCommand());

    await sleep(2000);
    removeTask(taskId);
  }

  function handleDialogOpenChange(open: boolean) {
    setIsOpen(open);

    if (!open) {
      // Clean up when dialog is closed
      clearFile();
    }
  }

  function clearFile() {
    setUploadedFile(null);
    setStructureData(null);
    setValidationError(null);
    setIsValidating(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
        >
          <SyncIcon className="mr-2 h-4 w-4" />
          {t("sync.button")}
        </Button>
      </DialogTrigger>

      <DialogContent className="border-gray-800 bg-gray-900 sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <SyncIcon className="h-5 w-5 text-pink-400" />
            {t("sync.dialog.title")}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {t("sync.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!uploadedFile ? (
            <FileUploader
              setUploadedFile={setUploadedFile}
              setValidationError={setValidationError}
              setIsValidating={setIsValidating}
              setStructureData={setStructureData}
              t={t}
            />
          ) : (
            <div className="space-y-4">
              <FilePreview
                file={uploadedFile}
                isValidating={isValidating}
                validationError={validationError}
                clearFile={clearFile}
              />

              <DeserializeResult
                data={structureData}
                validationError={validationError}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleDialogOpenChange(false)}
            className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
          >
            {t("sync.dialog.cancel")}
          </Button>

          <Button
            onClick={handleSync}
            className="bg-pink-600 text-white hover:bg-pink-700"
            disabled={!structureData || !!validationError} // Enable only if data is valid
          >
            <Play className="mr-2 h-4 w-4" />
            {t("sync.dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DeserializeResultProps = {
  data: StructuredPlaylistsDefinition | null;
  validationError: string | null;
};

/**
 * Display the result of deserialization of the structured playlist definition JSON file.
 * It shows validation errors or the details of the deserialized data.
 * @param param0
 * @returns
 */
function DeserializeResult({ data, validationError }: DeserializeResultProps) {
  return (
    <>
      {validationError && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4">
          <p className="text-red-400 text-sm">{validationError}</p>
        </div>
      )}

      {data && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-4">
          {/* TODO: Add translations */}
          <h4 className="mb-2 font-medium text-green-400">ファイル検証完了</h4>
          <div className="space-y-1 text-gray-300 text-sm">
            <p>バージョン: {data.version}</p>
            <p>プロバイダー: {data.provider}</p>
            <p>ルートプレイリスト: {data.playlists.length}個</p>
          </div>
        </div>
      )}
    </>
  );
}

interface FilePreviewProps {
  file: File;
  isValidating: boolean;
  validationError: string | null;
  clearFile: () => void;
}

/**
 * Preview component for the uploaded file
 * Display file name, size, validation status, and a button to clear the file.
 * @param param0
 * @returns
 */
function FilePreview({
  file,
  isValidating,
  validationError,
  clearFile,
}: FilePreviewProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-800 p-4">
      <FileText className="h-8 w-8 text-blue-400" />
      <div className="flex-1">
        <h4 className="font-medium text-white">{file.name}</h4>
        <p className="text-gray-400 text-sm">
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isValidating ? (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
        ) : validationError ? (
          <AlertCircle className="h-6 w-6 text-red-400" />
        ) : (
          <CheckCircle className="h-6 w-6 text-green-400" />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          onClick={clearFile}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

type FileUploaderProps = {
  setUploadedFile: (file: File | null) => void;
  setValidationError: (error: string | null) => void;
  setIsValidating: (isValidating: boolean) => void;
  setStructureData: (data: StructuredPlaylistsDefinition | null) => void;
  t: TFunction;
};

function FileUploader({
  setUploadedFile,
  setValidationError,
  setIsValidating,
  setStructureData,
  t,
}: FileUploaderProps) {
  const handleFile = useCallback(
    async (file: File) => {
      setUploadedFile(file);
      setValidationError(null);
      setIsValidating(true);

      // Parse and validate the file
      const raw = await file.text();
      const data = deserialize(raw);
      setIsValidating(false);

      if (data.isErr()) {
        if (
          data.error.code ===
          StructuredPlaylistsDefinitionDeserializeErrorCode.VALIDATION_ERROR
        ) {
          setValidationError(
            `Structured playlists definition is invalid. See more details in the console.`,
          );
          // biome-ignore lint/suspicious/noConsole: Should display error in console for debugging
          console.error(data.error.error);
        } else {
          setValidationError(
            `${data.error.code}: ${StructuredPlaylistsDefinitionValidationErrorMessages[data.error.code]}`,
          );
        }
        setStructureData(null);
        return;
      }
      setStructureData(data.value);
      setValidationError(null);
    },
    [setUploadedFile, setValidationError, setIsValidating, setStructureData],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const jsonFile = acceptedFiles.find(
        (file) =>
          file.type === "application/json" || file.name.endsWith(".json"),
      );

      if (jsonFile) {
        handleFile(jsonFile);
      } else {
        setValidationError("JSONファイルを選択してください");
      }
    },
    [handleFile, setValidationError],
  );

  const onDropRejected = useCallback(() => {
    setValidationError("JSONファイルのみアップロード可能です");
  }, [setValidationError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "application/json": [".json"], // Accept only JSON files
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    noClick: false,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 ${
        isDragActive
          ? "border-pink-500 bg-pink-500/10"
          : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/50"
      }`}
    >
      <input {...getInputProps()} />

      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
        <Upload className="h-8 w-8 text-gray-400" />
      </div>

      <h4 className="mb-2 font-medium text-lg text-white">
        {t("sync.dialog.uploader.title")}
      </h4>
      <p className="mb-4 text-gray-400">
        {t("sync.dialog.uploader.description")}
      </p>
      <div className="text-gray-500 text-xs">
        {t("sync.dialog.uploader.format")}
      </div>
    </div>
  );
}

const StructuredPlaylistsDefinitionValidationErrorMessages: Record<
  Exclude<
    StructuredPlaylistsDefinitionDeserializeErrorCode,
    StructuredPlaylistsDefinitionDeserializeErrorCode.VALIDATION_ERROR
  >,
  string
> = {
  // Deserialization errors
  [StructuredPlaylistsDefinitionDeserializeErrorCode.INVALID_JSON]:
    "Invalid JSON format. Please check the file syntax.",
  [StructuredPlaylistsDefinitionDeserializeErrorCode.DEPENDENCY_CYCLE]:
    "The structured playlist definition contains a dependency cycle. Please resolve the circular dependencies or recreate the file.",
  [StructuredPlaylistsDefinitionDeserializeErrorCode.UNKNOWN_ERROR]:
    "An unknown error occurred while processing the file. This is likely a bug. Please report it on GitHub: https://github.com/suzuki3jp/playlistwizard/issues",
};
