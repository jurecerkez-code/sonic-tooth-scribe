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
    
    // Parse FormData from request
    const formData = await req.formData();
    const audioFile = formData.get('file') as File;
    const timestamp = formData.get('timestamp') as string;
    const duration = formData.get('duration') as string;
    const type = formData.get('type') as string;
    
    console.log('=== N8N Webhook Call Debug ===');
    console.log('Webhook URL:', webhookUrl);
    console.log('Request Type:', type);
    console.log('Timestamp:', timestamp);
    console.log('Duration:', duration);
    
    if (!audioFile) {
      console.error('No audio file in FormData');
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Audio File:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });
    
    // Validate audio file has proper format
    const supportedFormats = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (!supportedFormats.some(format => audioFile.type.includes(format.split('/')[1]))) {
      console.error('=== Format Validation Error ===');
      console.error('Unsupported audio format:', audioFile.type);
      console.error('Supported formats:', supportedFormats);
      console.error('==============================');
      
      return new Response(
        JSON.stringify({ 
          error: 'Unsupported audio format',
          receivedFormat: audioFile.type,
          supportedFormats 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('✓ Audio format validated');
    console.log('==============================');
    
    // Create new FormData for n8n - field name doesn't matter, n8n saves as $binary.data
    const n8nFormData = new FormData();
    n8nFormData.append('file', audioFile);
    n8nFormData.append('timestamp', timestamp || new Date().toISOString());
    n8nFormData.append('duration', duration || '0');
    n8nFormData.append('source', 'DentalChart AI');
    n8nFormData.append('type', type || 'voice_recording');

    console.log('Sending FormData to n8n with MP3 audio file...');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: n8nFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== N8N Webhook Error ===');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Response Body:', errorText);
      console.error('========================');
      
      // Parse error for specific issues
      let errorMessage = `Webhook responded with ${response.status}`;
      if (errorText.toLowerCase().includes('format') || 
          errorText.toLowerCase().includes('unsupported') ||
          errorText.toLowerCase().includes('file') ||
          errorText.toLowerCase().includes('binary')) {
        errorMessage = 'Audio format error in n8n/OpenAI. Ensure n8n webhook accepts binary data in field "audio" and OpenAI node can process MP3.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText,
          suggestion: 'Check n8n workflow: 1) Webhook node accepts binary data, 2) Binary field is named "audio", 3) OpenAI node references correct binary property'
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await response.text();
    console.log('=== N8N Success ===');
    console.log('Response:', result);
    console.log('===================');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Voice recording sent to automation successfully',
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
        details: 'Failed to send audio to automation webhook'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
