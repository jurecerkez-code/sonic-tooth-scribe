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
    const isJson = ct.toLowerCase().includes("application/json");
    const isMultipart = ct.toLowerCase().includes("multipart/form-data");

    console.log("=== Incoming Request Debug ===");
    console.log("Content-Type:", ct);
    console.log("Method:", req.method);

    let body: any = null;
    let parseMode = "raw";

    if (isJson) {
      parseMode = "json";
      try {
        body = await req.json();
      } catch (e) {
        console.error("JSON parse failed:", e);
        // Fallback: try text and parse JSON
        const raw = await req.text();
        try {
          body = JSON.parse(raw || "{}");
        } catch (e2) {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } else if (isMultipart) {
      parseMode = "multipart";
      try {
        const form = await req.formData();
        const file = form.get("file") as File | null;
        const audioDataField = form.get("audioData") as string | null;

        if (file) {
          const buf = new Uint8Array(await file.arrayBuffer());
          const base64 = btoa(String.fromCharCode(...buf));
          const mimeType = file.type || "audio/webm";
          body = {
            audioData: base64,
            mimeType,
            extension: mimeToExt(mimeType),
            fileName: file.name || `recording_${Date.now()}.${mimeToExt(mimeType)}`,
          };
        } else if (audioDataField) {
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
      } catch (e) {
        // If formData decode fails (bad boundary or consumed body), fallback to raw text
        console.error("formData() failed, falling back to raw:", e);
        const raw = await req.text();
        const looksJson = raw.trim().startsWith("{") && raw.trim().endsWith("}");
        if (looksJson) {
          try {
            body = JSON.parse(raw);
            parseMode = "json-fallback";
          } catch (e2) {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          parseMode = "raw-base64";
          body = {
            audioData: raw,
            mimeType: "audio/webm",
            extension: "webm",
            fileName: `recording_${Date.now()}.webm`,
          };
        }
      }
    } else {
      parseMode = "raw";
      const raw = await req.text();
      const looksJson = raw.trim().startsWith("{") && raw.trim().endsWith("}");
      if (looksJson) {
        try {
          body = JSON.parse(raw);
          parseMode = "json-fallback";
        } catch (e) {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        body = {
          audioData: raw,
          mimeType: "audio/webm",
          extension: "webm",
          fileName: `recording_${Date.now()}.webm`,
        };
      }
    }

    console.log("Parse mode:", parseMode);

    // Normalize data URLs if present
    if (typeof body.audioData === "string" && body.audioData.includes(",")) {
      body.audioData = body.audioData.split(",").pop();
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
