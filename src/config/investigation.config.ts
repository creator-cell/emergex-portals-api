export const investigationConfig = {
  assignmentStrategy: process.env.INVESTIGATION_ASSIGNMENT_STRATEGY || 'completing_user',
  autoAssign: true,
  autoCreateOnComplete: true,
  defaultResponsibilities: [
    "Review incident details and timeline",
    "Collect and preserve evidence",
    "Interview witnesses and stakeholders",
    "Analyze root cause",
    "Document findings and recommendations",
    "Submit investigation report",
  ],
};
