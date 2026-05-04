import type { StaticImageData } from "next/image";
import ProductionIcon from "@/images/icon.png";
import DevIcon from "../../../../assets/icon_dev.png";
import LocalIcon from "../../../../assets/icon_local.png";

type AppEnvironment = "local" | "staging" | "production";

export const getAppEnvironment = (): AppEnvironment => {
  const vercelEnv =
    process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV;

  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "staging";

  return "local";
};

export const getAppIcon = (): StaticImageData => {
  const environment = getAppEnvironment();

  if (environment === "production") return ProductionIcon;
  if (environment === "staging") return DevIcon;

  return LocalIcon;
};
