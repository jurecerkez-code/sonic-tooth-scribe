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
    const audioFile = formData.get('audio') as File;
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
    
    // Validate audio format - must be MP3
    const fileName = audioFile.name.toLowerCase();
    const mimeType = audioFile.type.toLowerCase();
    
    if (!fileName.endsWith('.mp3') && !mimeType.includes('mp3') && !mimeType.includes('mpeg')) {
      console.error('=== Format Validation Error ===');
      console.error('Invalid audio format');
      console.error('File name:', fileName);
      console.error('MIME type:', mimeType);
      console.error('Required: .mp3 extension or audio/mp3 MIME type');
      console.error('==============================');
      
      return new Response(
        JSON.stringify({ 
          error: 'Only MP3 format is supported',
          receivedFormat: `${fileName} (${mimeType})`,
          requiredFormat: 'audio/mp3 with .mp3 extension'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('✓ Audio format validated as MP3');
    console.log('==============================');
    
    // Create new FormData for n8n with proper MP3 format
    const n8nFormData = new FormData();
    
    // Ensure the audio file has .mp3 extension and correct MIME type
    const mp3Blob = new Blob([await audioFile.arrayBuffer()], { type: 'audio/mp3' });
    n8nFormData.append('audio', mp3Blob, 'recording.mp3');
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
