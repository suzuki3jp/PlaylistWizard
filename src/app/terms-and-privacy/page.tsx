import { Trans } from "react-i18next/TransWithoutContext";

import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import {
    GOOGLE_CONNECTIONS,
    GOOGLE_PRIVACY_POLICY,
    YOUTUBE_TOS,
} from "@/constants";
import { useServerT } from "@/hooks";
import type { PageProps } from "@/types";

export default async function TermsAndPrivacy({ searchParams }: PageProps) {
    const { t } = await useServerT(searchParams);

    return (
        <section className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">
                    {t("terms.title")}
                </h2>
                <p className="text-muted-foreground">
                    {t("terms.effective-date")}
                </p>
            </div>

            <p className="text-muted-foreground">{t("terms.definition")}</p>

            <div className="grid gap-2">
                <h3 className="text-2xl font-bold tracking-tight">
                    {`1. ${t("terms.acceptance-of-terms.title")}`}
                </h3>
                <Text>
                    <Trans
                        i18nKey="terms.acceptance-of-terms.content"
                        components={{
                            1: <Link href={YOUTUBE_TOS} underline />,
                            2: <Link href={GOOGLE_PRIVACY_POLICY} underline />,
                        }}
                    />
                </Text>
            </div>

            <div className="grid gap-2">
                <h3 className="text-2xl font-bold tracking-tight">
                    {`2. ${t("terms.limitation-of-liability.title")}`}
                </h3>
                <Text>{t("terms.limitation-of-liability.content")}</Text>
            </div>

            <div className="grid gap-2">
                <h3 className="text-2xl font-bold tracking-tight">
                    {`3. ${t("terms.youtube-data-api.title")}`}
                </h3>
                <Text>{t("terms.youtube-data-api.content")}</Text>
            </div>

            <div className="grid gap-2">
                <h3 className="text-2xl font-bold tracking-tight">
                    {`4. ${t("terms.how-to-revoke.title")}`}
                </h3>
                <Text>
                    <Trans
                        i18nKey="terms.how-to-revoke.content"
                        components={{
                            1: <Link href={GOOGLE_CONNECTIONS} underline />,
                        }}
                    />
                </Text>
            </div>

            <div className="grid gap-2">
                <h3 className="text-2xl font-bold tracking-tight">
                    {`5. ${t("terms.security-of-data.title")}`}
                </h3>
                <Text>{t("terms.security-of-data.content")}</Text>
            </div>

            <div className="grid gap-2">
                <h3 className="text-2xl font-bold tracking-tight">
                    {`6. ${t("terms.disclosures-of-data.title")}`}
                </h3>
                <Text>{t("terms.disclosures-of-data.content")}</Text>
            </div>

            <div className="grid gap-2">
                <h3 className="text-2xl font-bold tracking-tight">
                    {`7. ${t("terms.google-analytics.title")}`}
                </h3>
                <Text>{t("terms.google-analytics.content")}</Text>
            </div>

            <div className="grid gap-2">
                <h3 className="text-2xl font-bold tracking-tight">
                    {`8. ${t("terms.update-and-changes.title")}`}
                </h3>
                <Text>{t("terms.update-and-changes.content")}</Text>
            </div>

            <div className="grid gap-2">
                <h3 className="text-2xl font-bold tracking-tight">
                    {`9. ${t("terms.governing-law.title")}`}
                </h3>
                <Text>{t("terms.governing-law.content")}</Text>
            </div>
        </section>
    );
}
