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

    // Parse FormData from request
    const formData = await req.formData();
    const audioFile = formData.get("file") as File;
    const timestamp = formData.get("timestamp") as string;
    const duration = formData.get("duration") as string;
    const type = formData.get("type") as string;

    console.log("=== N8N Webhook Call Debug ===");
    console.log("Webhook URL:", webhookUrl);
    console.log("Request Type:", type);
    console.log("Timestamp:", timestamp);
    console.log("Duration:", duration);

    if (!audioFile) {
      console.error("No audio file in FormData");
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Audio File:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    });

    // Validate audio file has proper format
    const supportedFormats = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg"];
    if (!supportedFormats.some((format) => audioFile.type.includes(format.split("/")[1]))) {
      console.error("=== Format Validation Error ===");
      console.error("Unsupported audio format:", audioFile.type);
      console.error("Supported formats:", supportedFormats);
      console.error("==============================");

      return new Response(
        JSON.stringify({
          error: "Unsupported audio format",
          receivedFormat: audioFile.type,
          supportedFormats,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("✓ Audio format validated");

    // **FIX: Convert audio file to base64**
    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    console.log("✓ Audio converted to base64");
    console.log("Audio size:", audioBuffer.byteLength, "bytes");
    console.log("Base64 length:", base64Audio.length, "characters");
    console.log("==============================");

    // **FIX: Send as JSON instead of FormData**
    const payload = {
      audioData: base64Audio,
      mimeType: audioFile.type,
      fileName: audioFile.name,
      timestamp: timestamp || new Date().toISOString(),
      duration: duration || "0",
      source: "DentalChart AI",
      type: type || "voice_recording",
    };

    console.log("Sending JSON payload to n8n...");

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

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
          suggestion: "Check n8n workflow configuration",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();
    console.log("=== N8N Success ===");
    console.log("Response:", result);
    console.log("===================");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Voice recording sent to automation successfully",
        webhookResponse: result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("=== Error Sending to N8N ===");
    console.error("Error:", error);
    console.error("===========================");

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: "Failed to send audio to automation webhook",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
