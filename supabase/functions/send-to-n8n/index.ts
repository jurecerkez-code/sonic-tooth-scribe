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
    console.log('Audio Format:', sessionData.format);
    console.log('Audio MIME Type:', sessionData.mimeType);
    console.log('Audio Extension:', sessionData.extension);
    console.log('==============================');
    
    // Validate audio format for voice recordings
    if (sessionData.type === 'voice_recording') {
      const supportedFormats = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 
                                'audio/flac', 'audio/m4a', 'audio/mp4', 'audio/mpga', 
                                'audio/oga', 'audio/webm'];
      
      if (sessionData.mimeType && !supportedFormats.some(format => 
          sessionData.mimeType.toLowerCase().includes(format.split('/')[1]))) {
        console.error('=== Format Validation Error ===');
        console.error('Unsupported audio format:', sessionData.mimeType);
        console.error('Supported formats:', supportedFormats);
        console.error('==============================');
        
        return new Response(
          JSON.stringify({ 
            error: 'Unsupported audio format. Please use MP3 for best results.',
            receivedFormat: sessionData.mimeType,
            supportedFormats 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Normalize format to MP3 for n8n/OpenAI compatibility
      sessionData.format = 'audio/mp3';
      sessionData.extension = sessionData.extension || 'mp3';
      
      console.log('Format normalized to MP3 for downstream processing');
    }

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
      
      // Check for format-related errors from n8n/OpenAI
      let errorMessage = `Webhook responded with ${response.status}: ${errorText}`;
      if (errorText.toLowerCase().includes('format') || 
          errorText.toLowerCase().includes('unsupported') ||
          errorText.toLowerCase().includes('file')) {
        errorMessage = 'Audio format not supported by n8n/OpenAI. Ensure binary data field is named "audio" and format is MP3-compatible.';
      }
      
      throw new Error(errorMessage);
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
    console.error('=== Error Sending to N8N ===');
    console.error('Error:', error);
    console.error('===========================');
    
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
