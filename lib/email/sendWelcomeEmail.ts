/**
 * @file lib/email/sendWelcomeEmail.ts
 * @description Email service using Resend SDK for dispatching new user account welcome emails.
 * Includes temporary login credentials and password reset instructions for first-time login.
 */

import { Resend } from "resend";

interface SendWelcomeEmailParams {
  toEmail: string;
  fullName: string;
  password: string;
  role: string;
}

export async function sendWelcomeEmail({
  toEmail,
  fullName,
  password,
  role,
}: SendWelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Missing RESEND_API_KEY environment variable.");
    return { success: false, error: "Missing RESEND_API_KEY configuration." };
  }

  const resend = new Resend(apiKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const loginUrl = `${appUrl}/login`;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "Eduland Portal <info@notifications.edulandschools.com>";

  const subject = "Your Eduland Portal account is ready";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #1c2b18; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-radius: 12px;">
      <h2 style="color: #1c2b18; font-size: 22px; margin-bottom: 8px;">Welcome to Eduland Portal</h2>
      <p style="font-size: 14px; color: #4a5568; margin-top: 0;">Hello <strong>${fullName || toEmail}</strong>,</p>
      
      <p style="font-size: 14px; color: #4a5568;">
        Your administrative account has been created with the role of <strong>${role}</strong>. You can now access your dashboard using the credentials below:
      </p>

      <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${toEmail}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="font-family: monospace; background-color: #edf2f7; padding: 2px 6px; border-radius: 4px; font-size: 15px; font-weight: bold; color: #2d3748;">${password}</code></p>
      </div>

      <p style="font-size: 13px; color: #e53e3e; font-weight: bold;">
        Important: For security reasons, you will be prompted to set a new password on your first login.
      </p>

      <div style="margin-top: 24px;">
        <a href="${loginUrl}" style="background-color: #eab308; color: #1c2b18; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 14px;">
          Log In to Eduland Portal
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 16px 0;" />
      <p style="font-size: 11px; color: #a0aec0;">
        Eduland School Portal &bull; If you did not expect this invitation, please contact your school administrator.
      </p>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html: htmlContent,
    });

    if (response.error) {
      console.error("Resend API returned error:", response.error);
      return {
        success: false,
        error: response.error.message || "Resend dispatch failed.",
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to dispatch welcome email via Resend:", err);
    return {
      success: false,
      error: err?.message || "Failed to dispatch email.",
    };
  }
}

interface SendPasswordResetEmailParams {
  toEmail: string;
  fullName: string;
  password: string;
}

export async function sendPasswordResetEmail({
  toEmail,
  fullName,
  password,
}: SendPasswordResetEmailParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Missing RESEND_API_KEY environment variable.");
    return { success: false, error: "Missing RESEND_API_KEY configuration." };
  }

  const resend = new Resend(apiKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const loginUrl = `${appUrl}/login`;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "Eduland Portal <info@notifications.edulandschools.com>";

  const subject = "Your Eduland Portal password has been reset";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #1c2b18; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #1c2b18; font-size: 22px; margin-bottom: 8px;">Password Reset Notification</h2>
      <p style="font-size: 14px; color: #4a5568; margin-top: 0;">Hello <strong>${fullName || toEmail}</strong>,</p>
      
      <p style="font-size: 14px; color: #4a5568;">
        An administrator has reset your password for your Eduland Portal account. You can now log in using the new temporary password below:
      </p>

      <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${toEmail}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>New Temporary Password:</strong> <code style="font-family: monospace; background-color: #edf2f7; padding: 2px 6px; border-radius: 4px; font-size: 15px; font-weight: bold; color: #2d3748;">${password}</code></p>
      </div>

      <p style="font-size: 13px; color: #e53e3e; font-weight: bold;">
        Important: For security reasons, you will be prompted to set a new password on your next login.
      </p>

      <div style="margin-top: 24px;">
        <a href="${loginUrl}" style="background-color: #eab308; color: #1c2b18; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 14px;">
          Log In to Eduland Portal
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 16px 0;" />
      <p style="font-size: 11px; color: #a0aec0;">
        Eduland School Portal &bull; If you did not request a password reset, please contact your school administrator immediately.
      </p>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html: htmlContent,
    });

    if (response.error) {
      console.error("Resend API returned error:", response.error);
      return {
        success: false,
        error: response.error.message || "Resend dispatch failed.",
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to dispatch password reset email via Resend:", err);
    return {
      success: false,
      error: err?.message || "Failed to dispatch email.",
    };
  }
}
