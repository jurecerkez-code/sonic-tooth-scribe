import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = 'https://n8n.linn.games/webhook-test/voice-process';
    const sessionData = await req.json();
    
    console.log('=== N8N Webhook Call Debug ===');
    console.log('Webhook URL:', webhookUrl);
    console.log('Session Data Type:', sessionData.type);
    console.log('Timestamp:', sessionData.timestamp);
    console.log('Has Audio Data:', !!sessionData.audioData);
    console.log('Audio Data Length:', sessionData.audioData?.length || 0);
    console.log('==============================');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'DentalChart AI',
        ...sessionData
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== N8N Webhook Error ===');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Response Body:', errorText);
      console.error('========================');
      throw new Error(`Webhook responded with ${response.status}: ${errorText}`);
    }

    const result = await response.text();
    console.log('=== N8N Success ===');
    console.log('Response:', result);
    console.log('===================');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Session data sent to automation successfully',
        webhookResponse: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending to n8n:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Failed to send session data to automation webhook'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
