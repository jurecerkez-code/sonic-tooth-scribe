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

    // 1) Read raw body first to avoid Deno guessing the parser
    let raw = "";
    try {
      raw = await req.text();
    } catch {
      raw = "";
    }

    // 2) Decide how to parse based on content-type and body shape
    let body: any = null;

    if (ct.includes("application/json")) {
      // Safe JSON parse from raw text
      try {
        body = JSON.parse(raw || "{}");
      } catch (e) {
        console.error("JSON parse failed:", e);
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (ct.includes("multipart/form-data")) {
      // Only call formData() when we know it's multipart
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const audioDataField = form.get("audioData") as string | null;

      if (file) {
        const buf = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        const mimeType = file.type || "audio/webm";
        body = {
          audioData: base64,
          mimeType,
          extension: mimeToExt(mimeType),
          fileName: file.name || `recording_${Date.now()}.${mimeToExt(mimeType)}`,
        };
      } else if (audioDataField) {
        // If someone posted base64 in a form field instead of a file
        body = {
          audioData: audioDataField,
          mimeType: "audio/webm",
          extension: "webm",
          fileName: `recording_${Date.now()}.webm`,
        };
      } else {
        return new Response(JSON.stringify({ error: "No audio found in form data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // 3) Fallback: if it's neither JSON nor multipart, try:
      //    a) parse as JSON if raw looks like JSON
      //    b) otherwise treat raw as base64 audio payload
      const looksJson = raw.trim().startsWith("{") && raw.trim().endsWith("}");
      if (looksJson) {
        try {
          body = JSON.parse(raw);
        } catch (e) {
          console.error("Fallback JSON parse failed:", e);
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        // Assume the raw body is base64 audio
        body = {
          audioData: raw,
          mimeType: "audio/webm",
          extension: "webm",
          fileName: `recording_${Date.now()}.webm`,
        };
      }
    }

    // Normalize data URLs if present
    if (typeof body.audioData === "string" && body.audioData.includes(",")) {
      body.audioData = body.audioData.split(",").pop(); // strip data:audio/...;base64,
    }

    console.log("Request Type:", body.type);
    console.log("Has audioData:", !!body.audioData);

    if (!body.audioData || typeof body.audioData !== "string") {
      console.error("No audioData in payload");
      return new Response(JSON.stringify({ error: "No audio data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✓ Audio data received");
    console.log("Base64 length:", body.audioData.length);

    const mimeType = body.mimeType || "audio/webm";
    const extension = body.extension || mimeToExt(mimeType);

    // Send to n8n as JSON
    const payload = {
      audioData: body.audioData,
      mimeType,
      fileName: body.fileName || `recording_${Date.now()}.${extension}`,
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
