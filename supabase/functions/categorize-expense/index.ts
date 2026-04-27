import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = ["Food", "Travel", "Stay", "Utilities", "Entertainment", "Shopping", "Health", "Other"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { title } = await req.json();
    if (!title || typeof title !== "string" || title.length > 200) {
      return new Response(JSON.stringify({ category: "Other" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SPLITSMART_API_KEY = Deno.env.get("SPLITSMART_API_KEY");
    if (!SPLITSMART_API_KEY) throw new Error("SPLITSMART_API_KEY missing");

    const resp = await fetch("https://ai.gateway.splitsmart.app/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${SPLITSMART_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are an expense classifier. Reply with EXACTLY one word from this list and nothing else: ${CATEGORIES.join(", ")}.`,
          },
          { role: "user", content: title },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ category: "Other", error: "rate_limited" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ category: "Other", error: "credits" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      console.error("AI error", resp.status, await resp.text());
      return new Response(JSON.stringify({ category: "Other" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();
    const raw = (data.choices?.[0]?.message?.content || "").trim();
    const found = CATEGORIES.find((c) => raw.toLowerCase().includes(c.toLowerCase())) || "Other";
    return new Response(JSON.stringify({ category: found }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ category: "Other" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
