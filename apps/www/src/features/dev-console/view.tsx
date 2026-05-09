import { Badge } from "@/components/ui/badge";
import type { DeveloperUser } from "@/lib/developer";
import { FEATURE_FLAGS, type FeatureFlagName } from "@/lib/feature-flags";
import { featureFlagDbRepository } from "@/repository/db/feature-flag/repository";
import { FeatureFlagToggle } from "./feature-flag-toggle";

type DevConsoleViewProps = {
  user: DeveloperUser;
};

export async function DevConsoleView({ user }: DevConsoleViewProps) {
  const enabledFlags = new Set(
    await featureFlagDbRepository.findEnabledFlagsByUserId(user.id),
  );
  const flags = Object.entries(FEATURE_FLAGS) as [
    FeatureFlagName,
    (typeof FEATURE_FLAGS)[FeatureFlagName],
  ][];

  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
        <header className="space-y-2">
          <p className="font-medium text-pink-400 text-sm">Developer</p>
          <h1 className="font-bold text-3xl text-white">Dev Console</h1>
          <p className="text-gray-400">
            Manage feature toggle allowlist entries for {user.email}.
          </p>
        </header>

        <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-950/60">
          <div className="grid grid-cols-[1fr_auto] gap-4 border-gray-800 border-b px-5 py-4 sm:grid-cols-[1fr_auto_auto_auto]">
            <span className="font-medium text-gray-300 text-sm">Flag</span>
            <span className="hidden font-medium text-gray-300 text-sm sm:block">
              Config
            </span>
            <span className="hidden font-medium text-gray-300 text-sm sm:block">
              Allowlist
            </span>
            <span className="font-medium text-gray-300 text-sm">Toggle</span>
          </div>

          <div className="divide-y divide-gray-800">
            {flags.map(([name, config]) => {
              const isAllowlisted = enabledFlags.has(name);

              return (
                <div
                  key={name}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div className="min-w-0 space-y-1">
                    <div>
                      <h2 className="truncate font-semibold text-white">
                        {name}
                      </h2>
                      {config.description ? (
                        <p className="text-gray-500 text-sm">
                          {config.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-gray-500 text-sm sm:hidden">
                      config {config.enabled ? "enabled" : "disabled"} / rollout{" "}
                      {Math.round(config.rollout * 100)}%
                    </p>
                  </div>

                  <div className="hidden items-center gap-2 sm:flex">
                    <Badge variant={config.enabled ? "default" : "secondary"}>
                      {config.enabled ? "enabled" : "disabled"}
                    </Badge>
                    <span className="text-gray-400 text-sm">
                      {Math.round(config.rollout * 100)}%
                    </span>
                  </div>

                  <Badge
                    className="hidden sm:inline-flex"
                    variant={isAllowlisted ? "default" : "outline"}
                  >
                    {isAllowlisted ? "on" : "off"}
                  </Badge>

                  <FeatureFlagToggle flagName={name} enabled={isAllowlisted} />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
