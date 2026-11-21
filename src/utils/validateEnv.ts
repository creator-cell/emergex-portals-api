/**
 * Validates critical environment variables at startup.
 * The server refuses to start if required secrets are missing or
 * insecure defaults are in use.
 */
export const validateEnv = (): void => {
  const errors: string[] = [];

  // Critical secrets
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "defaultSecret") {
    errors.push("JWT_SECRET must be set to a strong random value (not the default)");
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters long");
  }
  if (!process.env.MONGO_URI) {
    errors.push("MONGO_URI is required");
  }

  // AWS — warn if not set (non-fatal, some features won't work)
  const awsVars = ["AWS_ACCESS_KEY", "AWS_SECRET_KEY", "AWS_BUCKET_NAME", "AWS_REGION"];
  const missingAws = awsVars.filter((v) => !process.env[v]);
  if (missingAws.length > 0) {
    console.warn(`[ENV WARNING] Missing AWS vars: ${missingAws.join(", ")} — file uploads will fail`);
  }

  if (errors.length > 0) {
    console.error("\n[STARTUP ERROR] Environment validation failed:");
    errors.forEach((e) => console.error(`  • ${e}`));
    console.error("");
    process.exit(1);
  }
};
