import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { groupName, currency, totalsByCategory, memberCount, settlementHints } = await req.json();
    const SPLITSMART_API_KEY = Deno.env.get("SPLITSMART_API_KEY");
    if (!SPLITSMART_API_KEY) throw new Error("SPLITSMART_API_KEY missing");

    const summary = `Group: ${groupName}. Currency: ${currency}. Members: ${memberCount}.
Spending by category: ${Object.entries(totalsByCategory).map(([k, v]) => `${k} ${currency}${v}`).join(", ")}.
Suggested settlements: ${settlementHints || "none"}.`;

    const resp = await fetch("https://ai.gateway.splitsmart.app/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${SPLITSMART_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a friendly financial assistant. Generate exactly 3 short, conversational spending insights (each under 22 words). Use emojis sparingly. Be specific to the data. Return them via the function tool.",
          },
          { role: "user", content: summary },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_insights",
            parameters: {
              type: "object",
              properties: {
                insights: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
              },
              required: ["insights"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_insights" } },
      }),
    });

    if (resp.status === 429 || resp.status === 402) {
      return new Response(JSON.stringify({ insights: [], error: resp.status === 429 ? "rate" : "credits" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      return new Response(JSON.stringify({ insights: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const insights = toolCall ? JSON.parse(toolCall.function.arguments).insights : [];
    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ insights: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
