import z, { ZodError } from "zod";

import * as dotenv from "dotenv";
import { fromZodError } from "zod-validation-error";
dotenv.config();

// The values below go through JSON.parse first, so 123456 arrives as a number and true as a boolean.
// text() accepts those and turns them back into a string, but still fails when the key is missing.
const text = () => z.union([z.string(), z.number(), z.boolean()]).transform(String);

export const envSchema = z
  .object({
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    DEBUG_LOG: z.coerce.boolean().default(false),
    WARN_LOG: z.coerce.boolean().default(true),
    ERROR_LOG: z.coerce.boolean().default(true),
    REQ_LOG: z.coerce.boolean().default(true),
    LOG_FILE: z.coerce.boolean().default(true),
    JWT_BEARER_SECRET: text(),
    JWT_REFRESH_SECRET: text().optional(),
    JWT_EXPIRES_IN: z.coerce.string().default("1d"),
    AUTH_SERVER_AUDIENCE: z.string().optional(),
    JWT_TTL: z.coerce.number().default(86400 * 365),
    PORT: z.coerce.number().default(5000),
    APP_URL: text(),
    DB_HOST: text(),
    DB_PORT: z.coerce.number().default(5432),
    DB_USER: text(),
    DB_PASSWORD: text(),
    DB_DATABASE: text(),
    ADMIN_EMAIL: text(),
    ADMIN_PASSWORD: text(),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    APP_ENV: z.enum(["local", "dev", "prod"]).default("local"),
    MAILER_HOST: z.string(),
    MAILER_PORT: z.coerce.number(),
    MAILER_SECURE: z.coerce.boolean(),
    MAILER_USER: text(),
    MAILER_PASSWORD: text(),
    MAILER_FROM: z.string(),
    BULB_REWARD_INTERVAL_SECOND: z.coerce.number().default(7 * 86400),
    BLOCK_QUERY_INTERVAL: z.coerce.number().default(10000),
    LONG_BREAK_THRESHOLD_IN_SECONDS: z.coerce.number().default(18 * 60 * 60), // 18Hours
    FRONTEND_URL: z.string().default("http://localhost:3000"),
    RTC_PORT_MIN: z.coerce.number().default(10000),
    RTC_PORT_MAX: z.coerce.number().default(10100),
    NETWORK_NAME: z.string().default("mainnet"),
    CHAIN_ID: z.coerce.number().default(1),
    PRIVATE_KEY: z.string().optional(),
  })
  .transform((envs) => {
    return {
      ...envs,
      REDIS_URL: !!envs.REDIS_PASSWORD
        ? `redis://:${envs.REDIS_PASSWORD}@${envs.REDIS_HOST}:${envs.REDIS_PORT}`
        : `redis://${envs.REDIS_HOST}:${envs.REDIS_PORT}`,
    };
  });

const env = (() => {
  try {
    return envSchema.parse(
      Object.entries(process.env).reduce(
        (prev, [key, val]) => ({
          ...prev,
          [key]: (() => {
            try {
              if (val) return JSON.parse(val);
              return val;
            } catch (error) {
              return val;
            }
          })(),
        }),
        {},
      ),
    );
  } catch (error) {
    if (error instanceof ZodError)
      throw new Error(`ENV ${fromZodError(error).message}`);
    else throw new Error(`ENV ${error}`);
  }
})();

export const appConfig = {
  default_schema_identifier: "public",
  default_migrations_folder: __dirname + "/../database/migrations",
  default_seeders_folder: __dirname + "/../database/seeders",
  tenant_migrations_folder: __dirname + "/../database/tenant_migrations",
  tenant_seeders_folder: __dirname + "/../database/tenant_seeders",
  recommended_bycrypt_rounds: 12,
  email_from: "mailer@schmserver.com",
  env,
};
