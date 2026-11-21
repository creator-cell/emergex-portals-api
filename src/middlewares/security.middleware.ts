import { Request, Response, NextFunction } from "express";

/**
 * Security headers middleware.
 * Adds HTTP security headers to every response without requiring Helmet.
 *
 * Applied before routes so every response — including error responses — carries them.
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Deny framing to prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Disable legacy XSS Auditor (modern browsers ignore it anyway)
  res.setHeader("X-XSS-Protection", "0");
  // Limit referrer information leakage
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Restrict browser feature access
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  // No caching of API responses that contain sensitive data
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  // Remove Express fingerprint
  res.removeHeader("X-Powered-By");

  // HSTS — only add when TLS is confirmed (reverse proxy sets this header)
  if (_req.headers["x-forwarded-proto"] === "https") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  next();
};

/**
 * MongoDB operator injection sanitiser.
 * Removes keys starting with $ or containing . from request body and query,
 * preventing NoSQL injection attacks like { "$where": "sleep(1000)" }.
 *
 * This replaces the need for the express-mongo-sanitize package.
 */
function sanitizeObject(obj: Record<string, unknown>): void {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key] as Record<string, unknown>);
    }
  }
}

export const mongoSanitize = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query as Record<string, unknown>);
  if (req.params) sanitizeObject(req.params as Record<string, unknown>);
  next();
};

/**
 * Strips null bytes and dangerous control characters from all string values
 * in the request body, preventing null-byte injection.
 */
function stripDangerousChars(obj: unknown): unknown {
  if (typeof obj === "string") {
    return obj.replace(/\x00/g, "").replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
  }
  if (Array.isArray(obj)) return obj.map(stripDangerousChars);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k,
        stripDangerousChars(v),
      ])
    );
  }
  return obj;
}

export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body) req.body = stripDangerousChars(req.body);
  next();
};
