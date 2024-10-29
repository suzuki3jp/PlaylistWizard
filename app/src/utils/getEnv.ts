import { Failure, type Result, Success } from "@playlistmanager/result";

export const getEnv = (keys: string[]): Result<string[], EnvError> => {
	let e: EnvError | null = null;
	const r: string[] = [];

	for (const k of keys) {
		const env = process.env[k];
		if (!e && !env) e = new EnvError(k);
		if (e && !env) e.addKey(k);
		if (env) r.push(env);
	}

	return e !== null ? new Failure(e) : new Success(r);
};

export class EnvError extends Error {
	private keys: string[];

	constructor(key: string) {
		super(EnvError.makeMessage([key]));
		this.keys = [key];
		this.name = "EnvError";
	}

	public addKey(key: string) {
		this.keys.push(key);
		this.message = EnvError.makeMessage(this.keys);
	}

	public static makeMessage(keys: string[]) {
		return `EnvError: ${keys.join(", ")} ${keys.length > 1 ? "are" : "is"} required`;
	}
}