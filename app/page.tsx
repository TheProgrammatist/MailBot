/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

export default function Home() {
  // ===== AI =====
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ===== Email Inputs =====
  const [emails, setEmails] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // ===== Template =====
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // ===== Result =====
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // ===== AI Generate =====
  const handleAIGenerate = async () => {
    if (!aiInput.trim()) {
      alert("Please paste some text for AI generation");
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: aiInput }),
      });

      const data = await res.json();

      if (data.error) {
        alert("AI generation failed");
      } else {
        setEmails((data.emails || []).join("\n"));
        setSubject(data.subject || "");
        setMessage(data.body || "");
      }
    } catch {
      alert("AI request failed");
    } finally {
      setAiLoading(false);
    }
  };

  // ===== Send Emails =====
  const handleSend = async () => {
    if (!subject || !message) {
      alert("Subject and message are required");
      return;
    }

    const formData = new FormData();
    formData.append("emails", emails);
    if (excelFile) formData.append("excel", excelFile);
    formData.append("subject", subject);
    formData.append("message", message);

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/send-mails", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch {
      alert("Failed to send emails");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Bulk Email Sender (Groq AI)
        </h1>

        {/* ================= AI SECTION ================= */}
        <h2 className="text-lg font-semibold mb-2">
          AI Email Generator
        </h2>

        <p className="text-sm text-gray-600 mb-2">
          Paste a job description or message. AI will extract emails and
          generate subject & body.
        </p>

        <textarea
          className="w-full border p-2 mb-3"
          rows={5}
          placeholder="Paste job description / message here..."
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
        />

        <button
          onClick={handleAIGenerate}
          disabled={aiLoading}
          className="bg-green-600 text-white px-4 py-2 rounded mb-6"
        >
          {aiLoading ? "Generating..." : "Generate Using AI"}
        </button>

        <hr className="mb-6" />

        {/* ================= EMAIL INPUT ================= */}
        <h2 className="text-lg font-semibold mb-2">
          Email List (Max 50)
        </h2>

        <textarea
          className="w-full border p-2 mb-3"
          rows={4}
          placeholder="Enter emails (comma or newline separated)"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
        />

        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
          className="mb-6"
        />

        {/* ================= TEMPLATE ================= */}
        <h2 className="text-lg font-semibold mb-2">
          Email Template (Plain Text)
        </h2>

        <input
          type="text"
          className="w-full border p-2 mb-3"
          placeholder="Email Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <textarea
          className="w-full border p-2 mb-6"
          rows={6}
          placeholder="Plain text email body"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* ================= RESUME INFO ================= */}
        <div className="mb-6 text-sm text-gray-700">
          📎 <strong>Resume:</strong> Attached automatically (
          <span className="italic">Ruchita_Resume.pdf</span>)
        </div>

        {/* ================= SEND ================= */}
        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
        >
          {loading ? "Sending Emails..." : "Send Emails"}
        </button>

        {/* ================= RESULT ================= */}
        {result && (
          <div className="mt-8">
            <h2 className="font-semibold mb-2">
              Sent {result.sent} / {result.total}
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.map((r: any, i: number) => (
                    <tr key={i}>
                      <td className="border p-2">{r.email}</td>
                      <td
                        className={`border p-2 font-semibold ${
                          r.status === "Sent"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {r.status}
                      </td>
                      <td className="border p-2">{r.error || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
