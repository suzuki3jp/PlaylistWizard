export class Logger {
  public readonly name: string;
  public readonly parent?: Logger;
  public readonly transport: LoggerTransport;
  public readonly level: LogLevel;

  constructor({ name, parent, transport, level }: LoggerOptions) {
    this.name = name;
    this.parent = parent;

    if (parent) {
      this.transport = parent.transport;
      this.level = parent.level;
    } else {
      this.transport = transport || console;
      this.level = level || "info";
    }
  }

  public debug(...messages: MessageType[]) {
    if (this.level !== "debug") return;
    const msg = this.makeMessage(this, messages);
    this.transport.debug(msg);
  }

  public info(...messages: MessageType[]) {
    if (this.level === "error") return;
    const msg = this.makeMessage(this, messages);
    this.transport.info(msg);
  }

  public error(...messages: MessageType[]) {
    const msg = this.makeMessage(this, messages);
    this.transport.error(msg);
  }

  public makeChild(name: string) {
    return new Logger({
      name,
      parent: this,
    });
  }

  private makeMessage(logger: Logger, messages: MessageType[]) {
    const loggers: Logger[] = [logger];
    let current: Logger = logger;

    while (current.parent) {
      loggers.unshift(current.parent);
      current = current.parent;
    }

    const loggerName = loggers.map((l) => l.name).join("/");

    const message = messages
      .map((msg) => this.convertMessageToString(msg))
      .join(" ");

    return `[${loggerName}] ${message}`;
  }

  private convertMessageToString(message: MessageType): string {
    if (typeof message === "string") return `${message}`;
    if (message instanceof Error) return `${message.name}: ${message.message}`;
    return `${JSON.stringify(message, null, 0).replace(/,/g, ", ").replace(/({)/, "{ ").replace(/(})/, " }")}`;
  }
}

type MessageType = string | Error | Record<string, unknown>;

export interface LoggerOptions {
  name: string;
  parent?: Logger;
  transport?: LoggerTransport;
  level?: LogLevel;
}

/**
 * Logger transport interface for Dependency Injection
 */
export interface LoggerTransport {
  debug: (message: string) => void;
  info: (message: string) => void;
  error: (message: string) => void;
}

export type LogLevel = "debug" | "info" | "error";
