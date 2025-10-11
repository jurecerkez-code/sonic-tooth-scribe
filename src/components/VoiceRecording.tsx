// In your VoiceRecording.tsx file, replace the sendAudioToN8n function:
    setTranscript("Voice recording sent for processing");
    onRecordingComplete("Voice recording processed");
    setOfflineMode(false);
    
    return true;
  } catch (error) {
    console.error('n8n Error:', {
      status: 'exception',
      error: error,
      timestamp: new Date().toISOString(),
      audioSize: audioBlob.size,
      audioType: audioBlob.type,
      attempt: retryAttempt + 1
    });

    // Retry logic for network errors
    if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
      const delays = [0, 5000, 30000];
      const delay = delays[retryAttempt];
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendAudioToN8n(audioBlob, retryAttempt + 1);
    }

    // Save to localStorage after max retries
    const audioData = await blobToBase64(audioBlob);
    const failedRecording: FailedRecording = {
      id: crypto.randomUUID(),
      audioData,
      timestamp: new Date().toISOString(),
      duration: recordingDuration,
      attempts: MAX_RETRY_ATTEMPTS,
      lastAttempt: new Date().toISOString()
    };

    const updated = [...failedRecordings, failedRecording];
    saveFailedRecordings(updated);

    setN8nStatus('down');
    setOfflineMode(true);

    toast({
      title: "Connection Error",
      description: "Recording saved locally and will sync when connection is restored.",
      variant: "destructive",
    });

    return false;
  }
};