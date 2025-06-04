const clipboardy = require("clipboardy").default;
const inquirer = require("inquirer").default;

async function main() {
  // Commit type choices
  const types = [
    { name: "feat:     New feature", value: "feat" },
    { name: "fix:      Bug fix", value: "fix" },
    { name: "perf:     Performance improvement", value: "perf" },
    { name: "docs:     Documentation only", value: "docs" },
    { name: "refactor: Refactoring", value: "refactor" },
    { name: "test:     Add or update tests", value: "test" },
    { name: "chore:    Other changes", value: "chore" },
    { name: "deps:     Dependency updates", value: "deps" },
  ];

  const scopes = [
    { name: "app:       PlaylistWizard Web Application", value: "app" },
    { name: "youtube:   @playlistwizard/youtube", value: "youtube" },
    { name: "spotify:   @playlistwizard/spotify", value: "spotify" },
    { name: "logger:    @playlistwizard/logger", value: "logger" },
    { name: "shared-ui: @playlistwizard/shared-ui", value: "shared-ui" },
  ];

  // Interactive prompts
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "type",
      message: "Select the type of commit:",
      choices: types,
    },
    {
      type: "list",
      name: "scope",
      message: "Enter the scope of the commit:",
      choices: scopes,
    },
    {
      type: "input",
      name: "msg",
      message: "Enter the commit message:",
      validate: (input) => (input.trim() ? true : "Please enter a message"),
    },
  ]);

  // Format
  const commitMsg = `${answers.type}(${answers.scope}): ${answers.msg.trim()}`;

  // Copy to clipboard
  await clipboardy.write(commitMsg);

  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.log(
    "\nThe generated commit message has been copied to your clipboard:",
  );
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.log(commitMsg);
}

main();
