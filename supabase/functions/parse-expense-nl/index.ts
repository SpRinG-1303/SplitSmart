import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { text, members } = await req.json() as { text: string; members: { id: string; name: string }[] };
    if (!text || typeof text !== "string" || text.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SPLITSMART_API_KEY = Deno.env.get("SPLITSMART_API_KEY");
    if (!SPLITSMART_API_KEY) throw new Error("SPLITSMART_API_KEY missing");

    const memberList = members.map((m) => `- ${m.name} (id: ${m.id})`).join("\n");

    const resp = await fetch("https://ai.gateway.splitsmart.app/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${SPLITSMART_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Extract expense info from natural-language text. The currency may be ₹, $, €, etc. Return only the numeric amount. "me", "I", "myself" map to the member literally named "You". Choose category from: Food, Travel, Stay, Utilities, Entertainment, Shopping, Health, Other.

Available members:
${memberList}

Always pick paidBy and splitWith as member IDs from the list above.`,
          },
          { role: "user", content: text },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_expense",
            description: "Extract expense fields from natural language",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                amount: { type: "number" },
                category: { type: "string", enum: ["Food", "Travel", "Stay", "Utilities", "Entertainment", "Shopping", "Health", "Other"] },
                paidBy: { type: "string", description: "Member id of the payer" },
                splitWith: { type: "array", items: { type: "string" }, description: "Member ids to split with (include payer)" },
                splitType: { type: "string", enum: ["equal", "exact", "percentage"] },
              },
              required: ["title", "amount", "category", "paidBy", "splitWith", "splitType"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_expense" } },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit. Try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      console.error("AI error", resp.status, await resp.text());
      return new Response(JSON.stringify({ error: "AI failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Could not parse" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
