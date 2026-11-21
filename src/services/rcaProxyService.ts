/**
 * RCA Proxy Service
 * Enriches the request with incident/investigation/witness data from the
 * main DB before forwarding to the RCA microservice.
 */
import { Types } from "mongoose";
import IncidentModel from "../models/IncidentModel";
import InvestigationModel from "../models/InvestigationModel";
import WitnessStatementModel from "../models/WitnessStatementModel";
import rcaClient from "../config/rcaClient";

// ─── Payload builder ──────────────────────────────────────────────────────────

async function buildRcaPayload(
  incidentId: string,
  projectId: string,
) {
  const incident = await IncidentModel.findOne({ id: incidentId }).lean();
  if (!incident) throw new Error(`Incident ${incidentId} not found`);

  const investigation = await InvestigationModel.findOne({
    incident: incident._id,
  }).lean();

  const witnesses = investigation
    ? await WitnessStatementModel.find({
        investigation: investigation._id,
      }).lean()
    : [];

  return {
    incidentId,
    projectId,
    incidentType: incident.type ?? null,
    level: incident.level ?? null,
    description: incident.description,
    status: incident.status,
    location: incident.location,
    countOfInjuredPeople: incident.countOfInjuredPeople ?? 0,
    countOfTotalPeople: incident.countOfTotalPeople ?? 0,
    financialLoss: incident.finance ? Number(incident.finance) : null,
    damageAssets: incident.damageAssets ?? [],
    utilityAffected: incident.utilityAffected ?? [],
    isNearMiss: incident.isNearMiss ?? false,
    evidenceFiles: (incident.image ?? []).map((url: string) => ({
      filename: url.split("/").pop() ?? "file",
      url,
      mime_type: "",
    })),
    witnessStatements: witnesses.map((ws: any) => ({
      description: ws.description,
      documents: (ws.documents ?? []).map((d: any) => ({
        filename: d.filename,
        url: d.url,
        mime_type: d.mimeType,
      })),
    })),
    tags: [],
    chatLogs: [],
    transcripts: [],
  };
}

// ─── Public service methods ───────────────────────────────────────────────────

export async function triggerAnalysis(
  incidentId: string,
  projectId: string,
  bearerToken: string,
) {
  const payload = await buildRcaPayload(incidentId, projectId);
  return rcaClient.post("/rca/analyze", bearerToken, payload);
}

export async function getReport(incidentId: string, bearerToken: string) {
  return rcaClient.get(`/rca/${incidentId}`, bearerToken);
}

export async function listReports(
  projectId: string,
  bearerToken: string,
  status?: string,
  skip = 0,
  limit = 20,
) {
  const qs = new URLSearchParams({
    project_id: projectId,
    skip: String(skip),
    limit: String(limit),
    ...(status ? { status } : {}),
  });
  return rcaClient.get(`/rca?${qs}`, bearerToken);
}

export async function refineReport(
  reportId: string,
  additionalContext: string,
  bearerToken: string,
) {
  return rcaClient.post("/rca/refine", bearerToken, {
    reportId,
    additionalContext,
  });
}

export async function approveReport(
  reportId: string,
  approvedBy: string,
  approverRole: string,
  notes: string | undefined,
  bearerToken: string,
) {
  return rcaClient.post("/rca/approve", bearerToken, {
    reportId,
    approvedBy,
    approverRole,
    notes,
  });
}

export async function rejectReport(
  reportId: string,
  rejectedBy: string,
  reason: string,
  bearerToken: string,
) {
  return rcaClient.post("/rca/reject", bearerToken, {
    reportId,
    rejectedBy,
    reason,
  });
}

export async function generatePdf(reportId: string, bearerToken: string) {
  return rcaClient.post(`/rca/${reportId}/generate-pdf`, bearerToken, {});
}

export async function getPdfDownloadUrl(reportId: string, bearerToken: string) {
  return rcaClient.get(`/rca/${reportId}/download`, bearerToken);
}
