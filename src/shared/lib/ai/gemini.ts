/**
 * Google Gemini API Client Utility
 * Uses native fetch without heavy external dependencies.
 */

export interface GeminiGenerateOptions {
  apiKey?: string;
  model?: string;
  systemInstruction?: string;
  prompt: string;
  temperature?: number;
  jsonMode?: boolean;
}

export async function callGeminiApi(options: GeminiGenerateOptions): Promise<string> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("GEMINI_API_KEY_MISSING: กรุณาระบุ Google Gemini API Key ในการตั้งค่า");
  }

  const model = options.model?.trim() || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const body: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: options.prompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options.jsonMode) {
    (body.generationConfig as Record<string, unknown>).responseMimeType = "application/json";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorJson = (await response.json()) as { error?: { message?: string } };
      if (errorJson?.error?.message) {
        errorDetail = errorJson.error.message;
      }
    } catch {
      // ignore json parse error on response failure
    }

    if (response.status === 400 || response.status === 403 || errorDetail.toLowerCase().includes("api_key_invalid")) {
      throw new Error(`Google Gemini API Key ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง: ${errorDetail}`);
    }
    if (response.status === 429) {
      throw new Error(`Google Gemini API ใช้งานเกินขีดจำกัด (Rate limit exceeded): ${errorDetail}`);
    }
    throw new Error(`เกิดข้อผิดพลาดในการเชื่อมต่อ Google Gemini API: ${errorDetail}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("ไม่ได้รับข้อความตอบกลับจาก Google Gemini API");
  }

  return text;
}

/**
 * Helper function to parse JSON response from Gemini, handling markdown code fences if present.
 */
export function parseGeminiJson<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned) as T;
}
