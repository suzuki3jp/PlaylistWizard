"use client";
import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import type { TFunction } from "i18next";
import { TriangleAlert } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePlaylistsQuery } from "../../queries/use-playlists";
import { calculateDefinitionStats } from "../../utils/structured-playlists-definition-stats";
import { PlaylistTreePreview } from "./playlist-tree-preview";
import { ResultCard } from "./result-card";

export interface StructuredPlaylistsDefinitionPreviewProps {
  definition: StructuredPlaylistsDefinition | null;
  t: TFunction;
}

export function StructuredPlaylistsDefinitionPreview({
  definition,
  t,
}: StructuredPlaylistsDefinitionPreviewProps) {
  const { data: playlists, isPending } = usePlaylistsQuery();

  if (definition !== null) {
    const stats =
      !isPending && playlists
        ? calculateDefinitionStats(definition, playlists)
        : null;

    return (
      <ResultCard title={t("sync.preview.validation-success")} type="success">
        <p>
          {t("sync.preview.provider")} {definition.provider}
        </p>
        <p>
          {t("sync.preview.root-playlists")} {definition.playlists.length}
        </p>
        {stats && (
          <>
            <p>
              {t("sync.preview.total-playlists")} {stats.totalPlaylists} /{" "}
              {t("sync.preview.total-tracks")} {stats.totalTracks}
            </p>
            {stats.unknownCount > 0 && (
              <p className="text-yellow-400">
                <TriangleAlert className="mr-1 inline h-4 w-4" />
                {t("sync.preview.playlists-not-found", {
                  count: stats.unknownCount,
                })}
              </p>
            )}
          </>
        )}

        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="preview" className="border-green-800/50">
            <AccordionTrigger className="text-green-400 hover:no-underline">
              {t("sync.preview.show-details")}
            </AccordionTrigger>
            <AccordionContent>
              {isPending ? (
                <p className="text-gray-400">{t("sync.preview.loading")}</p>
              ) : (
                <PlaylistTreePreview
                  definition={definition}
                  playlists={playlists ?? []}
                  unknownPlaylistLabel={t("sync.preview.unknown-playlist")}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ResultCard>
    );
  }

  return (
    <ResultCard title={t("sync.preview.validation-error")} type="error">
      <p>{t("sync.preview.no-definition")}</p>
    </ResultCard>
  );
}
