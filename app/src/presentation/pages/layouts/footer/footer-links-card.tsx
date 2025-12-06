import type { WithT } from "i18next";
import { Link } from "@/presentation/common/link";

type FooterLinksCardProps = {
  titleKey: string;
  links: { labelKey: string; href: string }[];
} & WithT;

export function FooterLinksCard({ t, titleKey, links }: FooterLinksCardProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-white">{t(titleKey)}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-gray-400 text-sm transition-colors hover:text-white"
            >
              {t(link.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
