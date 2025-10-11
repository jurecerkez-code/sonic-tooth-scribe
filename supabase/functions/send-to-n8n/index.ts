import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = "https://n8n.linn.games/webhook-test/voice-process";

    console.log("=== Incoming Request Debug ===");
    console.log("Content-Type:", req.headers.get("content-type"));
    console.log("Method:", req.method);

    // Parse JSON body (NOT formData)
    const body = await request.json(); // ✅ Use this instead

    console.log("Request Type:", body.type);
    console.log("Has audioData:", !!body.audioData);

    if (!body.audioData) {
      console.error("No audioData in JSON payload");
      return new Response(JSON.stringify({ error: "No audio data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✓ Audio data received");
    console.log("Base64 length:", body.audioData.length);

    // Send to n8n as JSON
    const payload = {
      audioData: body.audioData,
      mimeType: body.mimeType || "audio/mp3",
      fileName: `recording_${Date.now()}.${body.extension || "mp3"}`,
      timestamp: body.timestamp || new Date().toISOString(),
      duration: body.duration || 0,
      source: "DentalChart AI",
      type: body.type || "voice_recording",
    };

    console.log("Sending to n8n webhook...");

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

      return new Response(
        JSON.stringify({
          error: `Webhook responded with ${response.status}`,
          details: errorText,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
