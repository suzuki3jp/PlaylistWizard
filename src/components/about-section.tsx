import type React from "react";
import { Trans } from "react-i18next/TransWithoutContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AUTHOR_GITHUB,
    AUTHOR_NAME,
    AUTHOR_X,
    SOURCE_CODE_GITHUB,
} from "@/constants";
import { useServerT } from "@/hooks";
import type { PageProps } from "@/types";
import { Link } from "./link";

export const AboutSection: React.FC<AboutSectionProps> = async ({
    searchParams,
}) => {
    const { t } = await useServerT(searchParams);

    return (
        <section className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">
                {t("about-section.title")}
            </h2>
            <p className="text-muted-foreground !m-0">
                {t("about-section.description")}
            </p>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            {t("about-section.what-is-playlistwizard.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            {t("about-section.what-is-playlistwizard.content")}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            {t("about-section.how-to-use.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            {t("about-section.how-to-use.content")}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            {t("about-section.contact.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            <Trans
                                i18nKey="about-section.contact.content"
                                values={{ dev: AUTHOR_NAME }}
                                components={{
                                    1: (
                                        <Link
                                            href={`${SOURCE_CODE_GITHUB}/issues`}
                                            className="underline"
                                            isOpenInNewTab
                                        />
                                    ),
                                    2: (
                                        <Link
                                            href={AUTHOR_X}
                                            className="underline"
                                            isOpenInNewTab
                                        />
                                    ),
                                }}
                            />
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            {t("about-section.note.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            <Trans
                                i18nKey="about-section.note.content"
                                values={{ dev: AUTHOR_NAME }}
                                components={{
                                    1: (
                                        <Link
                                            href={AUTHOR_GITHUB}
                                            className="underline"
                                        />
                                    ),
                                    2: (
                                        <Link
                                            href={"/terms-and-privacy"}
                                            className="underline"
                                        />
                                    ),
                                }}
                            />
                        </p>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
};

export type AboutSectionProps = Readonly<PageProps>;
