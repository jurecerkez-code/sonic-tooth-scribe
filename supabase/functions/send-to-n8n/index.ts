import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse JSON body instead of FormData
    const body = await req.json();

    console.log("=== N8N Webhook Call Debug ===");
    console.log("Timestamp:", body.timestamp);
    console.log("Duration:", body.duration);
    console.log("Request Type:", body.type);

    const webhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    console.log("Webhook URL:", webhookUrl);

    if (!webhookUrl) {
      throw new Error("N8N_WEBHOOK_URL environment variable is not set");
    }

    // Validate audio data
    if (!body.audioData || body.audioData.length === 0) {
      throw new Error("No audio data received");
    }

    // Convert base64 back to blob for n8n
    const base64Data = body.audioData;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: body.mimeType });

    // Create File object
    const audioFile = new File([audioBlob], body.fileName, { type: body.mimeType });

    console.log("Audio File:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    });

    console.log("✓ Audio format validated");

    // Create FormData for n8n
    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("timestamp", body.timestamp);
    formData.append("duration", body.duration);
    formData.append("type", body.type || "voice_recording");

    console.log("Sending FormData to n8n with audio file...");
    console.log("==============================");

    // Send to n8n webhook
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary
    });

    if (!n8nResponse.ok) {
      const responseBody = await n8nResponse.text();
      console.error("=== N8N Webhook Error ===");
      console.error("Status:", n8nResponse.status);
      console.error("Status Text:", n8nResponse.statusText);
      console.error("Response Body:", responseBody);
      console.error("========================");

      return new Response(
        JSON.stringify({
          error: "n8n webhook failed",
          status: n8nResponse.status,
          statusText: n8nResponse.statusText,
          details: responseBody,
        }),
        {
          status: n8nResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await n8nResponse.json();
    console.log("✓ Successfully sent to n8n");

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("=== Error Sending to N8N ===");
    console.error("Error:", error);
    console.error("===========================");

    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error occurred",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
