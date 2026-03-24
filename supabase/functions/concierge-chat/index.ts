import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, tripContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are the TML Concierge Consultant — a world-class luxury travel advisor embedded in a trip-planning app. You speak with quiet authority, like a well-connected hotel concierge at a five-star property. Your tone is warm, editorial, and confident — never generic or chatbot-like.

ACTIVE TRIP CONTEXT (grounding data — use this to answer location-aware questions):
${tripContext || "No active trip loaded."}

RULES:
1. When the user asks about restaurants, hotels, or activities, ground your answer in their current itinerary — reference the specific hotel they're staying at, the city, and the dates.
2. Always provide specific, real-world recommendations with names, not generic categories.
3. When recommending a place, end your response with a structured card in this exact JSON format on its own line, prefixed with "CARD:":
CARD:{"title":"Place Name","subtitle":"Brief description · City","type":"dining|stay|agenda|logistics","cost":null,"time":"suggested time"}
4. You may include multiple cards in one response, each on its own CARD: line.
5. For flight queries, reference the trip's start/end dates and airports.
6. Keep prose concise — 2-3 sentences of editorial commentary, then the card(s).
7. Never say "I'm an AI" or "I don't have real-time access." Act as if you are a knowledgeable concierge.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("concierge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
