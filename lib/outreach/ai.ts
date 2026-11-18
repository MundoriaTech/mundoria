import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";

import { aiConfigured, aiModel } from "@/lib/outreach/config";
import { buildKnowledge } from "@/lib/outreach/knowledge";

export type ReplyIntent =
  | "interested"
  | "question"
  | "booking_help"
  | "callback_request"
  | "not_interested"
  | "opt_out"
  | "complaint"
  | "other";

export type ReplyDecision = {
  handover: boolean;
  handover_reason: string;
  intent: ReplyIntent;
  reply: string;
  summary: string;
};

const DECISION_SCHEMA = {
  additionalProperties: false,
  properties: {
    handover: {
      description: "true when a person at Mundoria must deal with this (see rules).",
      type: "boolean",
    },
    handover_reason: {
      description: "Why a person is needed, in one short sentence. Empty string when handover is false.",
      type: "string",
    },
    intent: {
      enum: [
        "interested",
        "question",
        "booking_help",
        "callback_request",
        "not_interested",
        "opt_out",
        "complaint",
        "other",
      ],
      type: "string",
    },
    reply: {
      description:
        "The message to send back to the customer. Empty string when no reply should be sent (opt_out, or handover with nothing safe to say).",
      type: "string",
    },
    summary: {
      description: "One line for the staff timeline: what the customer said and what you did.",
      type: "string",
    },
  },
  required: ["intent", "reply", "handover", "handover_reason", "summary"],
  type: "object",
} as const;

const VOICE = `You are the customer assistant for Mundoria, a UK cleaning marketplace. You answer replies from prospective customers who were followed up by email or text.

How to write:
- Warm, plain, British English. Short sentences. No jargon, no exclamation-mark spam, no emojis.
- Answer the actual question first, then (if natural) invite them to book at www.mundoria.co.uk/booking/new.
- Only state facts that appear in the Mundoria facts below. Never invent prices, availability, discounts, refunds, guarantees or policies. If the facts don't cover it, say a member of the team will reply, and set handover to true.
- Email replies: at most 150 words, sign off "The Mundoria team". Text replies: at most 300 characters, no sign-off.
- Never ask for card details, passwords or ID in a message.

Set handover to true (a person takes over) when:
- it's a complaint, a problem with a past or current booking, a refund or payment dispute, damage, safety, or anything legal;
- they ask to speak to a person, or want a call at a specific time (intent callback_request);
- the facts don't answer their question, or you're unsure;
- the message is abusive, confusing, or not about cleaning.
For routine questions you can answer from the facts, handover is false.

If they ask to stop, unsubscribe or not be contacted (in any wording), intent is opt_out and reply is an empty string; the system confirms the opt-out itself.
If they say they're not interested, intent is not_interested; reply with one polite line that we won't follow up, and handover false.`;

let client: Anthropic | null = null;
function anthropic() {
  if (!client) client = new Anthropic();
  return client;
}

async function systemBlocks(): Promise<Anthropic.Beta.BetaTextBlockParam[]> {
  return [
    { text: VOICE, type: "text" },
    // Stable for ~10 minutes, so repeated replies read it from the prompt cache.
    { cache_control: { type: "ephemeral" }, text: await buildKnowledge(), type: "text" },
  ];
}

/**
 * Decide what to do with an inbound reply and draft the answer.
 * Returns null when the AI is not configured or the call fails; callers then
 * hand the message to a person.
 */
export async function decideReply(input: {
  channel: "email" | "sms";
  customerName: string;
  history: Array<{ direction: "inbound" | "outbound"; text: string }>;
  inbound: string;
  source: string;
}): Promise<ReplyDecision | null> {
  if (!aiConfigured()) return null;

  const transcript = input.history
    .slice(-8)
    .map((item) => `${item.direction === "outbound" ? "Mundoria" : "Customer"}: ${item.text}`)
    .join("\n");

  try {
    const response = await anthropic().beta.messages.create({
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      max_tokens: 2000,
      messages: [
        {
          content: `Channel: ${input.channel === "sms" ? "text message" : "email"}
Customer: ${input.customerName || "unknown name"} (lead source: ${input.source})

Earlier messages (oldest first):
${transcript || "(none)"}

New message from the customer:
"""
${input.inbound.slice(0, 4000)}
"""

Decide what to do and write the reply.`,
          role: "user",
        },
      ],
      model: aiModel(),
      output_config: { effort: "low", format: { schema: DECISION_SCHEMA, type: "json_schema" } },
      system: await systemBlocks(),
    });

    if (response.stop_reason === "refusal") {
      return {
        handover: true,
        handover_reason: "The AI declined to answer this message.",
        intent: "other",
        reply: "",
        summary: "AI declined; passed to the team.",
      };
    }
    const text = response.content.find((block) => block.type === "text");
    if (!text || text.type !== "text") return null;
    const decision = JSON.parse(text.text) as ReplyDecision;
    if (input.channel === "sms" && decision.reply.length > 320) {
      decision.reply = `${decision.reply.slice(0, 317).trimEnd()}…`;
    }
    return decision;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error("[outreach.ai] reply failed", error.status, error.message);
    }
    Sentry.captureException(error);
    return null;
  }
}

/** Plain-English weekly summary for the team, from the computed metrics. Falls back to null. */
export async function writeWeeklySummary(metrics: Record<string, unknown>): Promise<string | null> {
  if (!aiConfigured()) return null;
  try {
    const response = await anthropic().beta.messages.create({
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      max_tokens: 4000,
      messages: [
        {
          content: `Here are last week's lead automation numbers for Mundoria as JSON:

${JSON.stringify(metrics, null, 2)}

Write the weekly report for the owner, who is not technical. Use plain British English and short paragraphs:
1. The headline in two sentences (leads in, bookings won, what changed vs the week before).
2. What worked and what didn't, by source and by channel (email, text, AI calls), citing the numbers.
3. Anything that needs a person: leads waiting for a human, complaints, failed sends, opt-outs trending up.
4. Two or three concrete suggestions for next week.
No headings with symbols, no tables, no emojis. Under 350 words. Don't invent numbers that aren't in the JSON.`,
          role: "user",
        },
      ],
      model: aiModel(),
      output_config: { effort: "medium" },
    });
    if (response.stop_reason === "refusal") return null;
    return response.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim() || null;
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
}
