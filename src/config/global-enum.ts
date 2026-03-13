export enum GlobalAdminRoles {
  SuperAdmin = "super-admin",
  ClientAdmin = "client-admin",
}

export enum AccountProviderType {
  Local = "Local",
  Google = "Google",
  Facebook = "Facebook",
}

export enum ConversationIdentity {
  INCIDENT = "incident",
}

export const InvestigationRoles = {
  INVESTIGATION_SPECIALIST: "Investigation Specialist",
} as const;
