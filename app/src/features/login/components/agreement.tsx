import { Trans } from "react-i18next/TransWithoutContext";

import type { WithT } from "@/@types";
import { HighlightedLink } from "@/features/common/components/highlighted-link";
import { makeLocalizedUrl } from "@/helpers/makeLocalizedUrl";

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
                href={makeLocalizedUrl(lang, "/login")}
                className="text-pink-400 underline hover:text-pink-300"
                key="login-link"
              />
            ),
            2: (
              <HighlightedLink
                href={makeLocalizedUrl(lang, "/terms")}
                className="text-pink-400 underline hover:text-pink-300"
                key="terms-link"
              />
            ),
          }}
        />
      </p>
    </div>
  );
}
