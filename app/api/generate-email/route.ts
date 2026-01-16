export const runtime = "nodejs";

import { NextResponse } from "next/server";

const CANDIDATE_PROFILE = `
Candidate Experience:
- My name is Ruchita Waghmare
- 5+ years of experience in Software Testing and QA Automation
- Strong hands-on experience with Selenium WebDriver and Java
- Expertise in TestNG framework
- BDD experience using Cucumber
- API testing using Rest Assured and Postman
`;

function safeParseJson(text: string) {
  text = text.replace(/```json|```/g, "").trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON found in AI response");
  }

  let json = text.substring(start, end + 1);

  // Fix unquoted keys
  json = json.replace(/(\w+)\s*:/g, '"$1":');

  return JSON.parse(json);
}

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY missing");
    }

    const { content } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const prompt = `
Return ONLY valid JSON. No markdown. No explanation.

Candidate Profile:
"""
${CANDIDATE_PROFILE}
"""

Job Description:
"""
${content}
"""

JSON format:
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
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    const parsed = safeParseJson(text);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("AI Generation Error:", error.message);

    return NextResponse.json(
      {
        error: "AI generation failed",
        reason: error.message,
      },
      { status: 500 }
    );
  }
}
