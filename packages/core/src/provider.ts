export const Provider = {
  GOOGLE: "google",
} as const;

export type Provider = (typeof Provider)[keyof typeof Provider];

export const toProvider = (provider: string): Provider => {
  if (provider === Provider.GOOGLE) return provider;
  throw new Error(`Unsupported provider: ${provider}`);
};
