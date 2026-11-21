import { Request, Response, NextFunction } from "express";
import * as rcaProxy from "../services/rcaProxyService";

// ─── POST /api/rca/:reportId/generate-pdf ────────────────────────────────────

export const generateRcaPdf = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { reportId } = req.params;
    const result = await rcaProxy.generatePdf(reportId, extractToken(req));
    if (!result.ok) {
      return res.status(result.status).json({ success: false, error: result.errorMessage });
    }
    return res.json({ success: true, data: result.data });
  } catch (err: any) {
    next(err);
  }
};

// ─── GET /api/rca/:reportId/download ─────────────────────────────────────────

export const getRcaPdfDownloadUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { reportId } = req.params;
    const result = await rcaProxy.getPdfDownloadUrl(reportId, extractToken(req));
    if (!result.ok) {
      return res.status(result.status).json({ success: false, error: result.errorMessage });
    }
    return res.json({ success: true, data: result.data });
  } catch (err: any) {
    next(err);
  }
};
import { ICustomRequest } from "../types/express";

/** Extract raw Bearer token from Authorization header (to forward as-is). */
function extractToken(req: Request): string {
  const auth = req.headers.authorization ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : auth;
}

// ─── POST /api/rca/analyze ────────────────────────────────────────────────────

export const analyzeIncident = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as ICustomRequest).user;
    const { incidentId, projectId } = req.body as {
      incidentId: string;
      projectId: string;
    };

    if (!incidentId || !projectId) {
      return res.status(400).json({
        success: false,
        error: "incidentId and projectId are required",
      });
    }

    const result = await rcaProxy.triggerAnalysis(
      incidentId,
      projectId,
      extractToken(req),
    );

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ success: false, error: result.errorMessage });
    }

    return res.status(202).json({ success: true, data: result.data });
  } catch (err: any) {
    next(err);
  }
};

// ─── GET /api/rca/:incidentId ─────────────────────────────────────────────────

export const getRcaReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { incidentId } = req.params;
    const result = await rcaProxy.getReport(incidentId, extractToken(req));

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ success: false, error: result.errorMessage });
    }

    return res.json({ success: true, data: result.data });
  } catch (err: any) {
    next(err);
  }
};

// ─── GET /api/rca ─────────────────────────────────────────────────────────────

export const listRcaReports = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId, status, skip, limit } = req.query as Record<
      string,
      string
    >;

    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, error: "projectId query param required" });
    }

    const result = await rcaProxy.listReports(
      projectId,
      extractToken(req),
      status,
      Number(skip ?? 0),
      Number(limit ?? 20),
    );

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ success: false, error: result.errorMessage });
    }

    return res.json({ success: true, data: result.data });
  } catch (err: any) {
    next(err);
  }
};

// ─── POST /api/rca/refine ─────────────────────────────────────────────────────

export const refineRca = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { reportId, additionalContext } = req.body as {
      reportId: string;
      additionalContext: string;
    };

    if (!reportId) {
      return res
        .status(400)
        .json({ success: false, error: "reportId is required" });
    }

    const result = await rcaProxy.refineReport(
      reportId,
      additionalContext ?? "",
      extractToken(req),
    );

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ success: false, error: result.errorMessage });
    }

    return res.status(202).json({ success: true, data: result.data });
  } catch (err: any) {
    next(err);
  }
};

// ─── POST /api/rca/approve ────────────────────────────────────────────────────

export const approveRca = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as ICustomRequest).user;
    const { reportId, notes } = req.body as {
      reportId: string;
      notes?: string;
    };

    if (!reportId) {
      return res
        .status(400)
        .json({ success: false, error: "reportId is required" });
    }

    const result = await rcaProxy.approveReport(
      reportId,
      user.id,
      user.role,
      notes,
      extractToken(req),
    );

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ success: false, error: result.errorMessage });
    }

    return res.json({ success: true, data: result.data });
  } catch (err: any) {
    next(err);
  }
};

// ─── POST /api/rca/reject ─────────────────────────────────────────────────────

export const rejectRca = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as ICustomRequest).user;
    const { reportId, reason } = req.body as {
      reportId: string;
      reason: string;
    };

    if (!reportId || !reason) {
      return res
        .status(400)
        .json({ success: false, error: "reportId and reason are required" });
    }

    const result = await rcaProxy.rejectReport(
      reportId,
      user.id,
      reason,
      extractToken(req),
    );

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ success: false, error: result.errorMessage });
    }

    return res.json({ success: true, data: result.data });
  } catch (err: any) {
    next(err);
  }
};
