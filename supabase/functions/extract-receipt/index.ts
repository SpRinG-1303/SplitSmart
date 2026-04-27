import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SPLITSMART_API_KEY = Deno.env.get("SPLITSMART_API_KEY");
    if (!SPLITSMART_API_KEY) throw new Error("SPLITSMART_API_KEY missing");

    const resp = await fetch("https://ai.gateway.splitsmart.app/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${SPLITSMART_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Extract the total amount, merchant/title, and category from this receipt photo. Currency can be any. Be conservative — pick the grand total (not subtotal).",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract receipt info." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_receipt",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                amount: { type: "number" },
                category: { type: "string", enum: ["Food", "Travel", "Stay", "Utilities", "Entertainment", "Shopping", "Health", "Other"] },
              },
              required: ["title", "amount", "category"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_receipt" } },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit. Try again." }), {
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
      return new Response(JSON.stringify({ error: "Could not read receipt" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(toolCall.function.arguments, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
