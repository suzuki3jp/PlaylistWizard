import { user } from "./schema";

export const betterAuthUserAdditionalFields = {
  isDeveloper: {
    type: "boolean",
    // The Drizzle adapter resolves fieldName against the table object's
    // property key. The SQL column name remains defined by schema.user.
    fieldName: "isDeveloper",
    input: false,
    required: false,
    defaultValue: false,
  },
} as const;

export const betterAuthUserAdditionalFieldNames = Object.values(
  betterAuthUserAdditionalFields,
).map((field) => field.fieldName);

export const hasBetterAuthUserAdditionalField = (fieldName: string): boolean =>
  fieldName in user;
