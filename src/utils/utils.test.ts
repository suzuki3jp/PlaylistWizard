import { Err, Ok } from "result4js";
import { describe, expect, test } from "vitest";

import { EnvError, getEnv, getRandomInt, sleep } from ".";

describe("getEnv", () => {
    test("should return the env value if it exists", () => {
        const key = "TEST_KEY";
        const value = "test value";
        process.env[key] = value;

        expect(getEnv([key])).toStrictEqual(Ok([value]));
    });

    test("should return an error if the env value does not exist", () => {
        const key = "TEST_KEY_2";
        const error = new EnvError(key);

        expect(getEnv([key])).toStrictEqual(Err(error));
    });
});

describe("getRandomInt", () => {
    test("should return an integer between min and max", () => {
        const min = 1;
        const max = 10;

        for (let i = 0; i < 100; i++) {
            const randomInt = getRandomInt(min, max);

            expect(randomInt).toBeGreaterThanOrEqual(min);
            expect(randomInt).toBeLessThanOrEqual(max);
        }
    });
});

describe("sleep", () => {
    test("should wait for the specified time", async () => {
        const start = Date.now();
        const time = 1000;

        await sleep(time);

        const end = Date.now();

        expect(end - start).toBeGreaterThanOrEqual(time);
    });
});
