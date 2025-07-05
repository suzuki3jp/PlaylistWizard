import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it } from "vitest";

import { EnvError, getEnv } from ".";

describe("getEnv of helpers", () => {
  beforeEach(() => {
    process.env.GET_ENV_TEST = "test";
    process.env.GET_ENV_TEST_2 = "test2";
  });

  it("should return the env variable if it exists", () => {
    const result = getEnv(["GET_ENV_TEST"]);
    expect(result.isOk()).toBe(true);
    expect(result).toEqual(ok(["test"]));
  });

  it("should return the env variables in correct order if multiple keys are provided", () => {
    const result = getEnv(["GET_ENV_TEST_2", "GET_ENV_TEST"]);
    expect(result.isOk()).toBe(true);
    expect(result).toEqual(ok(["test2", "test"]));

    const result2 = getEnv(["GET_ENV_TEST", "GET_ENV_TEST_2"]);
    expect(result2.isOk()).toBe(true);
    expect(result2).toEqual(ok(["test", "test2"]));
  });

  it("should return an error if any of the env variables are missing", () => {
    const result = getEnv(["GET_ENV_TEST", "MISSING_ENV"]);
    expect(result.isOk()).toBe(false);
    expect(result).toEqual(err(new EnvError("MISSING_ENV")));
  });
});
