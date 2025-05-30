import Image from "next/image";

import Icon from "@/images/icon.png";

type PlaylistWizardLogoProps = {
  /**
   * Number of pixels using for width, height props of next/image.
   * Defaults to 16
   */
  size?: number;
};

export function PlaylistWizardLogo({ size = 16 }: PlaylistWizardLogoProps) {
  return (
    <Image
      src={Icon}
      width={size}
      height={size}
      alt="PlaylistWizard logo image"
    />
  );
}
