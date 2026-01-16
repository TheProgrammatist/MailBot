/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "nodejs";
import { NextResponse } from "next/server";

const CANDIDATE_PROFILE = `
Candidate Experience:
- My name is Ruchita Waghamre
- 5+ years of experience in Software Testing and QA Automation
- Strong hands-on experience with Selenium WebDriver and Java
- Expertise in TestNG framework for test execution and reporting
- Extensive experience in BDD using Cucumber
- Strong experience in API testing using Rest Assured and Postman
- Experience in designing and maintaining automation frameworks
- Familiar with CI/CD and Agile methodologies
`;

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const prompt = `
You are an assistant helping to write job application emails.

You are given:
1. Candidate experience profile
2. Job description or message

Your task:
- Extract all email addresses from the input
- Understand the job requirements from the input
- Match the candidate's experience with relevant skills from the job description
- Generate a PROFESSIONAL, CUSTOMIZED, PLAIN TEXT email body
- Highlight only RELEVANT skills from the candidate profile
- Do NOT list all skills blindly
- Keep the email concise and personalized

Candidate Profile:
"""
${CANDIDATE_PROFILE}
"""

Job Description / Input:
"""
${content}
"""

Rules:
- Plain text only
- Professional tone
- Short and role-focused

Respond ONLY in valid JSON:
{
  "emails": [],
  "subject": "",
  "body": ""
}
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    const jsonText = text.slice(
      text.indexOf("{"),
      text.lastIndexOf("}") + 1
    );

    return NextResponse.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error("Groq Error:", error.message);
    return NextResponse.json(
      { error: "AI generation failed", reason: error.message },
      { status: 500 }
    );
  }
}
