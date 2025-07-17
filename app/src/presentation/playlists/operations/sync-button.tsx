"use client";
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
import { StructuredPlaylistsDefinitionTypeErrorCode } from "@/repository/structured-playlists/type-check";
import type { StructuredPlaylistDefinitionInterface } from "@/usecase/interface/structured-playlists";
import type { TFunction } from "i18next";

interface SyncButtonProps {
  lang: string;
}

export function SyncButton({ lang }: SyncButtonProps) {
  const { t } = useT(lang, "operation");
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // State for file handling
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [structureData, setStructureData] =
    useState<StructuredPlaylistDefinitionInterface | null>(null);

  function handleSync() {
    alert("Playlist sync is not implemented yet.");
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
  data: StructuredPlaylistDefinitionInterface | null;
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
          <h4 className="mb-2 font-medium text-green-400">ファイル検証完了</h4>
          <div className="space-y-1 text-gray-300 text-sm">
            <p>バージョン: {data.version}</p>
            <p>プロバイダー: {data.provider}</p>
            <p>ユーザー ID: {data.user_id}</p>
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
  setStructureData: (
    data: StructuredPlaylistDefinitionInterface | null,
  ) => void;
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
        setValidationError(
          `${data.error}: ${StructuredPlaylistsDefinitionValidationErrorMessages[data.error]}`,
        );
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
  | StructuredPlaylistsDefinitionDeserializeErrorCode
  | StructuredPlaylistsDefinitionTypeErrorCode,
  string
> = {
  // Deserialization errors
  [StructuredPlaylistsDefinitionDeserializeErrorCode.INVALID_JSON]:
    "Invalid JSON format. Please check the file syntax.",
  [StructuredPlaylistsDefinitionDeserializeErrorCode.DEPENDENCY_CYCLE]:
    "The structured playlist definition contains a dependency cycle. Please resolve the circular dependencies or recreate the file.",
  [StructuredPlaylistsDefinitionDeserializeErrorCode.UNKNOWN_ERROR]:
    "An unknown error occurred while processing the file. This is likely a bug. Please report it on GitHub: https://github.com/suzuki3jp/playlistwizard/issues",

  // Type errors
  [StructuredPlaylistsDefinitionTypeErrorCode.INVALID_NAME]:
    "The 'name' field must be a valid string.",
  [StructuredPlaylistsDefinitionTypeErrorCode.INVALID_PROVIDER]:
    "The 'provider' field must be either 'google' or 'spotify'.",
  [StructuredPlaylistsDefinitionTypeErrorCode.INVALID_USER_ID]:
    "The 'user_id' field must be a valid string.",
  [StructuredPlaylistsDefinitionTypeErrorCode.INVALID_PLAYLISTS]:
    "The 'playlists' field must be an array.",
  [StructuredPlaylistsDefinitionTypeErrorCode.INVALID_PLAYLIST_STRUCTURE]:
    "Each playlist must be an object with a valid 'id' field and an optional 'dependencies' field.",
  [StructuredPlaylistsDefinitionTypeErrorCode.MISSING_FIELD]:
    "The structured playlist definition is missing one or more required fields: version, name, provider, user_id, playlists.",
  [StructuredPlaylistsDefinitionTypeErrorCode.INVALID_VERSION]:
    "The 'version' field must be a supported version number. Currently, only version 1 is supported.",
  [StructuredPlaylistsDefinitionTypeErrorCode.UNSUPPORTED_VERSION]:
    "The version specified in the structured playlist definition is not supported. Currently, only version 1 is supported.",
  [StructuredPlaylistsDefinitionTypeErrorCode.INVALID_PLAYLIST_ID]:
    "Each playlist must have a valid 'id' field that is a non-empty string.",
  [StructuredPlaylistsDefinitionTypeErrorCode.INVALID_PLAYLIST_DEPENDENCIES]:
    "Each playlist's 'dependencies' field must be an array of valid playlist objects.",
};
