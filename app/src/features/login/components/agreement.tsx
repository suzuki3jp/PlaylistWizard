import { Trans } from "react-i18next/TransWithoutContext";

import type { WithT } from "@/@types";
import { makeLocalizedUrl } from "@/helpers/makeLocalizedUrl";
import { HighlightedLink } from "@/presentation/common/highlighted-link";

interface AgreementProps extends WithT {
  lang: string;
}

export function Agreement({ t, lang }: AgreementProps) {
  return (
    <div className="text-center text-gray-400 text-xs">
      <p>
        <Trans
          t={t}
          i18nKey={"agreement"}
          components={{
            1: (
              <HighlightedLink
                href={makeLocalizedUrl(lang, "/terms")}
                className="text-pink-400 underline hover:text-pink-300"
                key="terms-link"
              />
            ),
            2: (
              <HighlightedLink
                href={makeLocalizedUrl(lang, "/privacy")}
                className="text-pink-400 underline hover:text-pink-300"
                key="privacy-link"
              />
            ),
          }}
        />
      </p>
    </div>
  );
}
