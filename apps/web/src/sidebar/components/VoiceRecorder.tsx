import React, { useRef, useState, useEffect, useCallback } from 'react';
import { socket } from '@/utils/socket';

interface VoiceRecorderProps {
  playerId: string;
  gameId: string;
  selectedModel: string;
  disabled?: boolean;
  onTranscriptionComplete: (transcript: string) => void;
  onBotCodeGenerated?: (code: string, transcript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecorder({
  playerId,
  gameId,
  selectedModel,
  disabled = false,
  onTranscriptionComplete,
  onBotCodeGenerated,
  onError,
}: VoiceRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // ---------- Helpers ----------
  const handleRecordingError = useCallback(
    (msg: string) => {
      console.error('[VoiceRecorder] Error:', msg);
      onError?.(msg);
    },
    [onError],
  );

  // ---------- Socket listeners ----------
  useEffect(() => {
    const handleTranscription = (data: { text: string }) => {
      console.log('[VoiceRecorder] Transcription received:', data.text);
      onTranscriptionComplete(data.text);
    };

    const handleTranscriptionError = (data: { error: string }) => {
      console.error('[VoiceRecorder] Transcription error:', data.error);
      onError?.(data.error);
    };
    
    const handleBotCodeGenerated = (data: { code: string; transcript: string; model: string; tokensUsed?: number }) => {
      console.log('[VoiceRecorder] Bot code generated:', data);
      onBotCodeGenerated?.(data.code, data.transcript);
    };
    
    const handleBotCodeGenerationError = (data: { error: string }) => {
      console.error('[VoiceRecorder] Bot code generation error:', data.error);
      onError?.(data.error);
    };

    socket.on('transcription-result', handleTranscription);
    socket.on('transcription-error', handleTranscriptionError);
    socket.on('bot-code-generated', handleBotCodeGenerated);
    socket.on('bot-code-generation-error', handleBotCodeGenerationError);

    return () => {
      socket.off('transcription-result', handleTranscription);
      socket.off('transcription-error', handleTranscriptionError);
      socket.off('bot-code-generated', handleBotCodeGenerated);
      socket.off('bot-code-generation-error', handleBotCodeGenerationError);
    };
  }, [onTranscriptionComplete, onBotCodeGenerated, onError]);

  // ---------- Recording logic ----------
  const startRecording = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Microphone access requires HTTPS. Please use https:// or configure SSL certificates.'
        );
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      // Notify server we are starting a new stream
      console.log('[VoiceRecorder] Starting audio stream');
      socket.emit('audio-stream-start', { playerId, model: selectedModel });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && socket.connected ) {
          e.data
            .arrayBuffer()
            .then((buffer) => {
              console.log('[VoiceRecorder] Sending audio chunk, bytes:', buffer.byteLength);
              socket.emit('audio-stream-data', buffer);
            })
            .catch((err) => handleRecordingError(err.message));
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[VoiceRecorder] Recording stopped, notifying server');
        socket.emit('audio-stream-end', { playerId });
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(250); // send chunk every 250 ms
      setIsRecording(true);
    } catch (err: any) {
      handleRecordingError(err.message || 'Failed to start recording');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return { isRecording, startRecording, stopRecording };
}