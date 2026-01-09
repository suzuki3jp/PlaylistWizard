export function register() {
  if (process.env.NODE_ENV === "development") {
    // biome-ignore lint/suspicious/noConsole: dev only
    console.log(
      `=================================================================================
      Please access to see the website to http://127.0.0.1:3000/ instead of localhost
      =================================================================================`,
    );
  }
}
