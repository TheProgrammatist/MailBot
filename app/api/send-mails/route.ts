/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST(req: Request) {
  const formData = await req.formData();

  const textEmails = formData.get("emails")?.toString() || "";
  const excel = formData.get("excel") as File | null;
  const subject = formData.get("subject")?.toString() || "";
  const message = formData.get("message")?.toString() || "";

  if (!subject || !message) {
    return NextResponse.json(
      { error: "Subject and message are required" },
      { status: 400 }
    );
  }

  let emails: string[] = [];

  // Text emails
  if (textEmails) {
    emails.push(
      ...textEmails
        .split(/[\n,]/)
        .map((e) => e.trim())
        .filter(Boolean)
    );
  }

  // Excel emails
  if (excel) {
    const buffer = Buffer.from(await excel.arrayBuffer());
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    rows.forEach((r) => {
      if (r.Email) emails.push(String(r.Email).trim());
    });
  }

  emails = [...new Set(emails)];

  if (emails.length === 0 || emails.length > 50) {
    return NextResponse.json(
      { error: "Invalid email count (1–50 allowed)" },
      { status: 400 }
    );
  }

  // 📄 Resume from public folder
  const resumePath = path.join(
    process.cwd(),
    "public",
    "Ruchita_Resume.pdf"
  );

  if (!fs.existsSync(resumePath)) {
    return NextResponse.json(
      { error: "Resume file not found in public folder" },
      { status: 500 }
    );
  }

  const resumeBuffer = fs.readFileSync(resumePath);

  // 📧 Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const results: any[] = [];
  let sent = 0;

  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject,
        text: message,
        attachments: [
          {
            filename: "Ruchita_Resume.pdf",
            content: resumeBuffer,
          },
        ],
      });

      sent++;
      results.push({ email, status: "Sent" });
      await delay(2500); // Gmail-safe delay
    } catch (err: any) {
      results.push({
        email,
        status: "Failed",
        error: err.message,
      });
    }
  }

  return NextResponse.json({
    total: emails.length,
    sent,
    failed: emails.length - sent,
    details: results,
  });
}
