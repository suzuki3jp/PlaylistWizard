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

	public debug(message: string | Error | Record<string, unknown>) {
		if (this.level !== "debug") return;
		const msg = this.makeMessage(this, message);
		this.transport.debug(msg);
	}

	public info(message: string | Error | Record<string, unknown>) {
		if (this.level === "error") return;
		const msg = this.makeMessage(this, message);
		this.transport.info(msg);
	}

	public error(message: string | Error | Record<string, unknown>) {
		const msg = this.makeMessage(this, message);
		this.transport.error(msg);
	}

	public makeChild(name: string) {
		return new Logger({
			name,
			parent: this,
		});
	}

	private makeMessage(
		logger: Logger,
		message: string | Error | Record<string, unknown>,
	) {
		const loggers: Logger[] = [logger];
		let current: Logger = logger;

		while (current.parent) {
			loggers.unshift(current.parent);
			current = current.parent;
		}

		const loggerName = loggers.map((l) => l.name).join("/");

		if (typeof message === "string") return `[${loggerName}] ${message}`;
		if (message instanceof Error)
			return `[${loggerName}] ${message.name}: ${message.message}`;
		return `[${loggerName}] ${JSON.stringify(message, null, 0).replace(/,/g, ", ").replace(/({)/, "{ ").replace(/(})/, " }")}`;
	}
}

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
