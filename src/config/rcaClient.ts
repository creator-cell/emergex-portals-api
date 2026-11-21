/**
 * HTTP client for the RCA microservice.
 * Singleton — import and call anywhere in portals-api.
 */

import { config } from "./index";

const RCA_ENGINE_URL = config.rca.engineUrl;
const RCA_INTERNAL_KEY = config.rca.internalApiKey;
const RCA_TIMEOUT_MS = 15_000;

export interface RcaHttpResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  errorMessage?: string;
}

/**
 * Forward a request to the RCA engine, passing the caller's JWT so the
 * RCA engine can verify it with the shared JWT_SECRET.
 */
async function request<T>(
  method: "GET" | "POST",
  path: string,
  bearerToken: string,
  body?: object,
): Promise<RcaHttpResponse<T>> {
  const url = `${RCA_ENGINE_URL}/api/v1${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RCA_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
        // Internal service key — proves the request originated from portals-api
        "X-Internal-Key": RCA_INTERNAL_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: null,
        errorMessage:
          json?.error?.message || `RCA engine returned ${res.status}`,
      };
    }

    return { ok: true, status: res.status, data: json?.data ?? json };
  } catch (err: any) {
    const isTimeout = err?.name === "AbortError";
    return {
      ok: false,
      status: isTimeout ? 504 : 502,
      data: null,
      errorMessage: isTimeout
        ? "RCA engine timed out"
        : "RCA engine unreachable",
    };
  } finally {
    clearTimeout(timeout);
  }
}

const rcaClient = {
  get: <T>(path: string, token: string) =>
    request<T>("GET", path, token),
  post: <T>(path: string, token: string, body: object) =>
    request<T>("POST", path, token, body),
};

export default rcaClient;
