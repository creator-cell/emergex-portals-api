import sgMail from '@sendgrid/mail';

export const initSendGrid = () => {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is missing in environment variables');
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  return sgMail;
};

export interface EmailParams {
  to: string;
  templateId: string;
  dynamicTemplateData?: Record<string, unknown>;
  from?: string;
  subject?: string;
}

export const sendTemplateEmail = async (params: EmailParams) => {
  const { to, templateId, dynamicTemplateData, from = process.env.DEFAULT_FROM_EMAIL, subject } = params;

  const msg = {
    to,
    from: from || 'no-reply@example.com',
    templateId,
    dynamicTemplateData,
    ...(subject && { subject }),
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
};