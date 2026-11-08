import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ChatSchema = z.object({
  message: z.string().min(1).max(4000),
  language: z.enum(["en", "hi", "kn", "te", "ta"]),
  context: z.string().max(2000).optional(),
});

const LANG_NAME: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  kn: "Kannada (ಕನ್ನಡ)",
  te: "Telugu (తెలుగు)",
  ta: "Tamil (தமிழ்)",
};

/* -------------------------------------------------------------------------- */
/* GEMINI API - NORMAL TEXT                                                   */
/* -------------------------------------------------------------------------- */

async function callAI(
  messages: unknown[],
  maxTokens = 800,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-3.6-flash",
        messages,
        max_tokens: maxTokens,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Gemini API key is invalid or does not have permission.",
      );
    }

    if (res.status === 429) {
      throw new Error(
        "Gemini API rate limit reached. Please wait and try again.",
      );
    }

    throw new Error(
      `Gemini API error ${res.status}: ${text.slice(0, 500)}`,
    );
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Gemini returned an empty response.");
  }

  return content;
}

/* -------------------------------------------------------------------------- */
/* GEMINI API - VISION                                                        */
/* -------------------------------------------------------------------------- */

async function callGeminiVision(
  messages: unknown[],
  maxTokens = 1200,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-3.6-flash",
        messages,
        max_tokens: maxTokens,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Gemini API key is invalid or does not have permission.",
      );
    }

    if (res.status === 429) {
      throw new Error(
        "Gemini API rate limit reached. Please wait and try again.",
      );
    }

    throw new Error(
      `Gemini Vision API error ${res.status}: ${text.slice(0, 500)}`,
    );
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Gemini returned an empty vision response.");
  }

  return content;
}

/* -------------------------------------------------------------------------- */
/* GEMINI API - STRUCTURED JSON                                               */
/* -------------------------------------------------------------------------- */

async function callStructuredAI(
  prompt: string,
  schema: Record<string, unknown>,
  maxTokens = 1800,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const models = ["gemini-3.6-flash"];

  let lastError = "";

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "x-goog-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                maxOutputTokens: maxTokens,
                responseMimeType: "application/json",
                responseSchema: schema,
              },
            }),
          },
        );

        if (res.ok) {
          const data = await res.json();

          const content =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!content) {
            throw new Error(
              `${model} returned an empty structured response.`,
            );
          }

          return content;
        }

        const errorText = await res.text().catch(() => "");

        lastError = `${model} returned ${res.status}: ${errorText.slice(
          0,
          500,
        )}`;

        if (res.status === 503 || res.status === 500) {
          if (attempt < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1500),
            );
            continue;
          }

          break;
        }

        if (res.status === 401 || res.status === 403) {
          throw new Error(
            "Gemini API key is invalid or does not have permission.",
          );
        }

        if (res.status === 429) {
          throw new Error(
            "Gemini API rate limit reached. Please wait and try again.",
          );
        }

        throw new Error(
          `Gemini structured API error ${res.status}: ${errorText.slice(
            0,
            500,
          )}`,
        );
      } catch (error) {
        if (error instanceof Error) {
          lastError = error.message;
        }

        if (attempt < 2) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1500),
          );

          continue;
        }

        break;
      }
    }
  }

  throw new Error(
    `Gemini structured API temporarily unavailable. ${lastError}`,
  );
}

/* -------------------------------------------------------------------------- */
/* TALK / FARMER ASSISTANT                                                    */
/* -------------------------------------------------------------------------- */

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatSchema.parse(input))
  .handler(async ({ data }) => {
    const langName = LANG_NAME[data.language];

    const system = `You are RaithaBandhu, a friendly agriculture expert for Indian farmers.

Reply ONLY in ${langName}.

Use simple, short sentences under 120 words.

Give practical and actionable advice.

Avoid unnecessary technical language.

${data.context ? `Context: ${data.context}` : ""}`;

    try {
      const reply = await callAI([
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: data.message,
        },
      ]);

      return {
        reply,
        error: null as string | null,
      };
    } catch (e) {
      return {
        reply: "",
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }
  });

/* -------------------------------------------------------------------------- */
/* CROP HEALTH ANALYSIS                                                       */
/* -------------------------------------------------------------------------- */

const CropSchema = z.object({
  imageBase64: z.string().min(50).max(8_000_000),
  language: z.enum(["en", "hi", "kn", "te", "ta"]),
  notes: z.string().max(500).optional(),
});

export const analyzeCrop = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CropSchema.parse(input))
  .handler(async ({ data }) => {
    const langName = LANG_NAME[data.language];

    const system = `You are a plant pathologist helping Indian farmers.

Analyze the crop photo and reply ONLY in ${langName}.

Structure your reply with:

1. Crop identified
2. Health status
3. Likely problem
4. Treatment / next steps
5. Prevention tip

Keep the response under 250 words.

Be honest if you are unsure.

Do not claim certainty when the image is unclear.`;

    try {
      const reply = await callGeminiVision(
        [
          {
            role: "system",
            content: system,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: data.notes
                  ? `Farmer notes: ${data.notes}`
                  : "Please analyze this crop.",
              },
              {
                type: "image_url",
                image_url: {
                  url: data.imageBase64,
                },
              },
            ],
          },
        ],
        1200,
      );

      return {
        reply,
        error: null as string | null,
      };
    } catch (e) {
      return {
        reply: "",
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }
  });

/* -------------------------------------------------------------------------- */
/* GOVERNMENT SCHEMES                                                         */
/* -------------------------------------------------------------------------- */

const SchemesSchema = z.object({
  language: z.enum(["en", "hi", "kn", "te", "ta"]),
  query: z.string().max(500).optional(),
  state: z.string().max(100).optional(),
});

export type SchemeItem = {
  name: string;
  nameEn: string;
  eligibility: string;
  benefit: string;
  howToApply: string;
  documents: string[];
  applyMode: "online" | "offline" | "both";
  applyUrl: string | null;
  scope: "central" | "state";
  stateName: string | null;
};

export type SchemesResult = {
  schemes: SchemeItem[];
};

export const getSchemes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SchemesSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      result: SchemesResult | null;
      error: string | null;
    }> => {
      const langName = LANG_NAME[data.language];

      const prompt = `Generate exactly 6 relevant Indian government agricultural schemes.

Language for all descriptive text: ${langName}.

${
  data.state
    ? `Focus ONLY on schemes available to farmers in ${data.state}. Do not include schemes belonging to any other state.`
    : "Include major central government farmer schemes. Do not include state-specific schemes."
}

${data.query ? `User search topic: ${data.query}` : ""}

Important rules:

- Give exactly 6 schemes.
- Use real Indian government schemes.
- Do not invent scheme names.
- Do not invent application URLs.
- If an official application URL is not known with confidence, use applyMode "offline" and applyUrl null.
- Central schemes must have scope "central".
- State-specific schemes must have scope "state".
- Never include a state scheme from a different state than the requested state.
- If reliable state-specific schemes are unavailable, return central government schemes instead.
- For state schemes, stateName must be the English state name.
- For central schemes, stateName must be null.
- documents must contain 3 to 6 items.
- All descriptive text must be in ${langName}.`;

      const schemeSchema = {
        type: "object",
        properties: {
          schemes: {
            type: "array",
            minItems: 6,
            maxItems: 6,
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                nameEn: {
                  type: "string",
                },
                eligibility: {
                  type: "string",
                },
                benefit: {
                  type: "string",
                },
                howToApply: {
                  type: "string",
                },
                documents: {
                  type: "array",
                  minItems: 3,
                  maxItems: 6,
                  items: {
                    type: "string",
                  },
                },
                applyMode: {
                  type: "string",
                  enum: ["online", "offline", "both"],
                },
                applyUrl: {
                  type: "string",
                  nullable: true,
                },
                scope: {
                  type: "string",
                  enum: ["central", "state"],
                },
                stateName: {
                  type: "string",
                  nullable: true,
                },
              },
              required: [
                "name",
                "nameEn",
                "eligibility",
                "benefit",
                "howToApply",
                "documents",
                "applyMode",
                "applyUrl",
                "scope",
                "stateName",
              ],
            },
          },
        },
        required: ["schemes"],
      };

      try {
        const raw = await callStructuredAI(
          prompt,
          schemeSchema,
          5000,
        );

        const parsed = JSON.parse(raw) as {
          schemes?: unknown[];
        };

        if (!Array.isArray(parsed.schemes)) {
          return {
            result: null,
            error: "Could not parse schemes. Please retry.",
          };
        }

        const schemes: SchemeItem[] = parsed.schemes
          .slice(0, 6)
          .map((item) => {
            const s = item as Partial<SchemeItem>;

            const mode =
              s.applyMode === "online" ||
              s.applyMode === "offline" ||
              s.applyMode === "both"
                ? s.applyMode
                : "offline";

            let applyUrl: string | null = null;

            if (
              mode !== "offline" &&
              typeof s.applyUrl === "string"
            ) {
              const url = s.applyUrl.trim();

              if (
                /^https?:\/\/[^\s]+(?:\.gov|\.nic)\.in(?:\/|$)/i.test(
                  url,
                )
              ) {
                applyUrl = url;
              }
            }

            const documents = Array.isArray(s.documents)
              ? s.documents
                  .map((d) => String(d))
                  .filter(Boolean)
                  .slice(0, 6)
              : [];

            const scope =
              s.scope === "state" ? "state" : "central";

            return {
              name: String(s.name ?? ""),
              nameEn: String(s.nameEn ?? ""),
              eligibility: String(s.eligibility ?? ""),
              benefit: String(s.benefit ?? ""),
              howToApply: String(s.howToApply ?? ""),
              documents,
              applyMode: mode,
              applyUrl,
              scope,
              stateName:
                scope === "state" && s.stateName
                  ? String(s.stateName)
                  : null,
            };
          });

        return {
          result: {
            schemes,
          },
          error: null,
        };
      } catch (e) {
        return {
          result: null,
          error: e instanceof Error ? e.message : "Unknown error",
        };
      }
    },
  );

/* -------------------------------------------------------------------------- */
/* MARKET PRICES                                                              */
/* -------------------------------------------------------------------------- */

const MarketSchema = z.object({
  language: z.enum(["en", "hi", "kn", "te", "ta"]),
  lat: z.number(),
  lon: z.number(),
  locationName: z.string().max(200).optional(),
});

export type MarketCrop = {
  name: string;
  price: number;
  predicted: number;
  demand: number;
  trend: "up" | "down" | "stable";
  alert: string;
};

export type MarketResult = {
  reply: string;
  crops: MarketCrop[];
  advice: string;
  disclaimer: string;
};

export const getMarketTrends = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => MarketSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      result: MarketResult | null;
      error: string | null;
    }> => {
      const langName = LANG_NAME[data.language];

      const loc =
        data.locationName ??
        `lat ${data.lat.toFixed(2)}, lon ${data.lon.toFixed(2)}`;

      const prompt = `Generate indicative agricultural mandi information for exactly 8 major crops around ${loc} in India.

Language for all text: ${langName}.

Rules:

- Exactly 8 crops.
- Use common crops relevant to the location.
- price is INR per quintal.
- predicted is an indicative predicted INR per quintal value.
- demand must be from 0 to 100.
- trend must be one of: up, down, stable.
- alert should be a short practical sentence in ${langName}.
- advice should contain two short sentences in ${langName}.
- disclaimer should clearly say that the prices are indicative and not guaranteed live mandi prices.
- Do not claim that these are real-time prices.
- Do not add any text outside the requested JSON structure.`;

      const marketSchema = {
        type: "object",
        properties: {
          reply: {
            type: "string",
          },
          crops: {
            type: "array",
            minItems: 8,
            maxItems: 8,
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                price: {
                  type: "number",
                },
                predicted: {
                  type: "number",
                },
                demand: {
                  type: "number",
                },
                trend: {
                  type: "string",
                  enum: ["up", "down", "stable"],
                },
                alert: {
                  type: "string",
                },
              },
              required: [
                "name",
                "price",
                "predicted",
                "demand",
                "trend",
                "alert",
              ],
            },
          },
          advice: {
            type: "string",
          },
          disclaimer: {
            type: "string",
          },
        },
        required: [
          "reply",
          "crops",
          "advice",
          "disclaimer",
        ],
      };

      try {
        const raw = await callStructuredAI(
          prompt,
          marketSchema,
          3000,
        );

        const parsed = JSON.parse(raw) as {
          reply?: unknown;
          crops?: unknown[];
          advice?: unknown;
          disclaimer?: unknown;
        };

        if (!Array.isArray(parsed.crops)) {
          return {
            result: null,
            error: "Could not parse market data. Please retry.",
          };
        }

        const crops: MarketCrop[] = parsed.crops
          .slice(0, 8)
          .map((item) => {
            const crop = item as Partial<MarketCrop>;

            const trend =
              crop.trend === "up" ||
              crop.trend === "down" ||
              crop.trend === "stable"
                ? crop.trend
                : "stable";

            return {
              name: String(crop.name ?? ""),
              price: Number(crop.price ?? 0),
              predicted: Number(crop.predicted ?? 0),
              demand: Math.max(
                0,
                Math.min(100, Number(crop.demand ?? 0)),
              ),
              trend,
              alert: String(crop.alert ?? ""),
            };
          });

        return {
          result: {
            reply: String(parsed.reply ?? ""),
            crops,
            advice: String(parsed.advice ?? ""),
            disclaimer:
              String(parsed.disclaimer ?? "") ||
              "These prices are indicative and are not guaranteed live mandi prices. Verify current rates with your local APMC before making transactions.",
          },
          error: null,
        };
      } catch (e) {
        return {
          result: null,
          error: e instanceof Error ? e.message : "Unknown error",
        };
      }
    },
  );