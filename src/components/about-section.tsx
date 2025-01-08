import type React from "react";
import { Trans } from "react-i18next/TransWithoutContext";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/shadcn-ui/card";
import {
    AUTHOR_GITHUB,
    AUTHOR_NAME,
    AUTHOR_X,
    SOURCE_CODE_GITHUB,
} from "@/constants";
import { useServerT } from "@/hooks";
import type { PageProps } from "@/types";
import { Link } from "./link";
import { Text } from "./text";

export const AboutSection: React.FC<AboutSectionProps> = async ({
    searchParams,
}) => {
    const { t } = await useServerT(searchParams);

    return (
        <section className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">
                {t("about-section.title")}
            </h2>
            <Text className="!m-0">{t("about-section.description")}</Text>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            {t("about-section.what-is-playlistwizard.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Text>
                            {t("about-section.what-is-playlistwizard.content")}
                        </Text>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            {t("about-section.how-to-use.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Text>{t("about-section.how-to-use.content")}</Text>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            {t("about-section.contact.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Text>
                            <Trans
                                i18nKey="about-section.contact.content"
                                values={{ dev: AUTHOR_NAME }}
                                components={{
                                    1: (
                                        <Link
                                            href={`${SOURCE_CODE_GITHUB}/issues`}
                                            underline
                                            isOpenInNewTab
                                        />
                                    ),
                                    2: (
                                        <Link
                                            href={AUTHOR_X}
                                            underline
                                            isOpenInNewTab
                                        />
                                    ),
                                }}
                            />
                        </Text>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            {t("about-section.note.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Text>
                            <Trans
                                i18nKey="about-section.note.content"
                                values={{ dev: AUTHOR_NAME }}
                                components={{
                                    1: <Link href={AUTHOR_GITHUB} underline />,
                                    2: (
                                        <Link
                                            href={"/terms-and-privacy"}
                                            underline
                                        />
                                    ),
                                }}
                            />
                        </Text>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
};

export type AboutSectionProps = Readonly<PageProps>;
