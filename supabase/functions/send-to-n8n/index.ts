import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = "https://n8n.linn.games/webhook-test/voice-process";

    const ct = req.headers.get("content-type") || "";
    console.log("=== Incoming Request Debug ===");
    console.log("Content-Type:", ct);
    console.log("Method:", req.method);

    if (!ct.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Expected application/json" }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // Normalize audioData if a data URL sneaks in
    let audioData = body.audioData;
    if (typeof audioData === "string" && audioData.includes(",")) {
      // Strip leading "data:audio/...;base64,"
      audioData = audioData.split(",").pop();
    }

    if (!audioData || typeof audioData !== "string") {
      return new Response(JSON.stringify({ error: "No audio data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mimeType = body.mimeType || "audio/webm";
    const extension = body.extension || mimeToExt(mimeType);

    console.log("✓ Audio data received");
    console.log("Base64 length:", audioData.length);
    console.log("mimeType:", mimeType, "-> extension:", extension);

    const payload = {
      audioData,
      mimeType,
      fileName: `recording_${Date.now()}.${extension}`,
      timestamp: body.timestamp || new Date().toISOString(),
      duration: body.duration || 0,
      source: "DentalChart AI",
      type: body.type || "voice_recording",
      meta: body.meta ?? null,
    };

    console.log("Sending to n8n webhook...");
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("n8n Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("=== N8N Webhook Error ===");
      console.error("Status:", response.status);
      console.error("Status Text:", response.statusText);
      console.error("Response Body:", errorText);
      console.error("========================");

      return new Response(JSON.stringify({ error: `Webhook responded with ${response.status}`, details: errorText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    return new Response(JSON.stringify({ error: errorMessage, details: "Failed to process audio request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
