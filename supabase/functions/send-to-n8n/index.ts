import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const mimeToExt = (mime: string) => {
  if (!mime) return "webm";
  if (mime.includes("mpeg")) return "mp3";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get webhook URL from environment variable
    const webhookUrl = Deno.env.get("N8N_WEBHOOK_URL") || "https://n8n.linn.games/webhook/voice-process";

    // Initialize Supabase client to verify token
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Debug logging (minimal in production)
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (Deno.env.get("ENVIRONMENT") === "development") {
      console.log("=== Incoming Request Debug ===");
      console.log("Edge Version:", "v3-json-only");
      console.log("Content-Type:", ct);
      console.log("Method:", req.method);
      console.log("User ID:", user.id);
    }

    // Enforce JSON-only - reject non-JSON requests
    if (!ct.includes("application/json")) {
      console.error("Rejected: Content-Type must be application/json");
      return new Response(JSON.stringify({ error: "Expected application/json" }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read body exactly once as text, then parse JSON
    const raw = await req.text();
    let body: any;

    try {
      body = JSON.parse(raw || "{}");
    } catch (e) {
      console.error("JSON parse failed:", e);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Request Type:", body.type);
    console.log("Has audioData:", !!body.audioData);

    // Validate audioData
    if (!body.audioData || typeof body.audioData !== "string") {
      console.error("Missing or invalid audioData");
      return new Response(JSON.stringify({ error: "No audio data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize data URLs - strip prefix if present (e.g., "data:audio/webm;base64,")
    if (body.audioData.includes(",")) {
      body.audioData = body.audioData.split(",").pop();
    }

    console.log("✓ Audio data received");
    console.log("Base64 length:", body.audioData.length);

    // Build payload for n8n
    const mimeType = body.mimeType || "audio/webm";
    const extension = body.extension || mimeToExt(mimeType);

    const payload = {
      audioData: body.audioData,
      mimeType,
      fileName: body.fileName || `recording_${Date.now()}.${extension}`,
      timestamp: body.timestamp || new Date().toISOString(),
      duration: Number(body.duration) || 0,
      source: "DentalChart AI",
      type: body.type || "voice_recording",
      meta: body.meta ?? null,
    };

    // Forward to n8n webhook
    console.log("Sending to n8n webhook...");
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("n8n Response Status:", response.status);

    // Handle n8n errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error("=== N8N Webhook Error ===");
      console.error("Status:", response.status);
      console.error("Status Text:", response.statusText);
      console.error("Response Body:", errorText);
      console.error("========================");

      return new Response(
        JSON.stringify({
          error: `Webhook responded with ${response.status}`,
          details: errorText,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Success response
    const data = await response.json().catch(() => ({}));
    console.log("✓ Success! n8n processed the audio");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("=== Error in Edge Function ===");
    console.error("Error:", error);
    console.error("==============================");

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: "Failed to process audio request",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
