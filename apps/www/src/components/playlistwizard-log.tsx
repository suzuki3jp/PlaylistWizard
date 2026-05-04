import Image from "next/image";

import { getAppIcon } from "@/lib/app-icon";

type PlaylistWizardLogoProps = {
  /**
   * Number of pixels using for width, height props of next/image.
   * Defaults to 16
   */
  size?: number;
};

export function PlaylistWizardLogo({ size = 16 }: PlaylistWizardLogoProps) {
  const icon = getAppIcon();

  return (
    <Image
      src={icon}
      width={size}
      height={size}
      alt="PlaylistWizard logo image"
    />
  );
}
