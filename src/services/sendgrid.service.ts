import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  console.warn(
    "WARNING: SENDGRID_API_KEY is not set. Email functionality will not work."
  );
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailData {
  to: string | string[];
  from: string;
  subject?: string;
  dynamicTemplateData?: Record<string, any>;
}

export class EmailService {
  public static async sendWithTemplate(
    emailData: EmailData,
    templateId: string
  ): Promise<[any, any]> {
    try {
      if (!emailData.to || !emailData.from) {
        throw new Error("Missing required email fields");
      }

      const msg = {
        to: emailData.to,
        from: emailData.from,
        templateId,
        dynamicTemplateData: emailData.dynamicTemplateData ?? {},
      };

      return await sgMail.send(msg);
    } catch (error) {
      console.error("Email sending failed:", error);
      throw error;
    }
  }

  public static async sendWelcome(
    to: string,
    firstName: string
  ): Promise<[any, any]> {
    const emailData: EmailData = {
      to,
      from: process.env.EMAIL_FROM ?? "no-reply@yourdomain.com",
      dynamicTemplateData: {
        firstName,
        email: to,
        currentYear: new Date().getFullYear(),
      },
    };

    const credentialsTempleteId =
      process.env.SENDGRID_WELCOME_TEMPLATE_ID ??
      "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    return this.sendWithTemplate(emailData, credentialsTempleteId);
  }

  public static async sendCredentialsEmail(
    to: string,
    firstName: string,
    password: string
  ): Promise<[any, any]> {
    const emailData: EmailData = {
      to,
      from: process.env.EMAIL_FROM ?? "no-reply@yourdomain.com",
      dynamicTemplateData: {
        firstName,
        email: to,
        password,
        currentYear: new Date().getFullYear(),
      },
    };

    const credentialsTempleteId =
      process.env.SENDGRID_CREDENTIALS_SEND_TEMPLATE_ID ??
      "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    return this.sendWithTemplate(emailData, credentialsTempleteId);
  }

  public static async sendAnnouncement(
    to: string,
    name: string,
    title: string,
    description: string,
    createdBy: string
  ): Promise<[any, any]> {
    const emailData: EmailData = {
      to,
      from: process.env.EMAIL_FROM ?? "no-reply@yourdomain.com",
      dynamicTemplateData: {
        name,
        title,
        description,
        createdBy,
        currentYear: new Date().getFullYear(),
      },
    };

    const announcementTempleteId =
      process.env.SENDGRID_ANNOUNCEMENT_SEND_TEMPLATE_ID ??
      "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    return this.sendWithTemplate(emailData, announcementTempleteId);
  }

  public static async sendPasswordResetEmail(
    to: string,
    name: string,
    resetLink: string
  ): Promise<[any, any]> {
    const emailData: EmailData = {
      to,
      from: process.env.EMAIL_FROM ?? "no-reply@yourdomain.com",
      dynamicTemplateData: {
        name,
        resetLink,
        expiryHours: 24,
      },
    };
    const passwordResetTemplateId =
      process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID ??
      "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    return this.sendWithTemplate(emailData, passwordResetTemplateId);
  }
}
