import type { Socket } from 'socket.io';
import OpenAI from 'openai';
import { PassThrough } from 'stream';
import { getClient } from '@repo/openai';
import { generateBotCodeService } from '../../services/botCodeGenerationService.js';

interface Session {
  stream: PassThrough;
  transcriptionPromise: Promise<string>;
}

type SessionMap = Record<string, Session>;

/**
 * Registers per-socket audio transcription listeners.
 * Each socket gets an independent streaming session so multiple players
 * can talk at the same time without blocking one another.
 */
export function registerAudioTranscriptionHandlers(io: import('socket.io').Server): void {
  const sessions: SessionMap = {};

  io.on('connection', (socket: Socket) => {
    console.log('[AudioHandler] Client connected:', socket.id);

    socket.on(
      'audio-stream-start',
      ({ playerId, model }: { playerId: string; model: string }) => {
        console.log(
          `[AudioHandler] audio-stream-start from socket=${socket.id}, player=${playerId}`,
        );

        if (sessions[socket.id]) {
          console.warn(
            '[AudioHandler] Previous session still active. Closing it.',
          );
          sessions[socket.id]?.stream.destroy(); // abort old session
          delete sessions[socket.id];
        }

        // Create a PassThrough stream that we will feed chunks into
        const pass = new PassThrough();

        // Kick off transcription request immediately so upload begins now
        const openai = getClient();
        const transcriptionPromise = (async () => {
          try {
            const file = await OpenAI.toFile(pass, 'prompt.webm'); // stream backed file
            const resp = await openai.audio.transcriptions.create({
              file,
              model: 'whisper-1',
              response_format: 'text',
            });
            console.log(
              `[AudioHandler] Transcription completed for socket=${socket.id}`,
            );
            return resp;
          } catch (err: any) {
            console.error(
              `[AudioHandler] OpenAI transcription error for socket=${socket.id}:`,
              err,
            );
            throw err;
          }
        })();

        sessions[socket.id] = {
          stream: pass,
          transcriptionPromise,
        };

        socket.data.playerId = playerId;
        socket.data.model = model;
      },
    );

    socket.on('audio-stream-data', (arrayBuffer: ArrayBuffer) => {
      const session = sessions[socket.id];
      if (!session) {
        console.warn(
          `[AudioHandler] Received chunk but no active session for socket=${socket.id}`,
        );
        return;
      }
      const buf = Buffer.from(arrayBuffer);
      session.stream.write(buf);
      console.log(
        `[AudioHandler] Chunk received (${buf.length} bytes) socket=${socket.id}`,
      );
    });

    socket.on('audio-stream-end', async () => {
      const session = sessions[socket.id];
      if (!session) {
        console.warn(
          `[AudioHandler] audio-stream-end but no active session for socket=${socket.id}`,
        );
        return;
      }

      console.log(`[AudioHandler] audio-stream-end socket=${socket.id}`);
      // Signal no more data
      session.stream.end();

      try {
        const text = await session.transcriptionPromise;
        socket.emit('transcription-result', { text });
        
        // Generate bot code from transcription
        const gameId = socket.data.gameId;
        const model = socket.data.model || 'gpt-3.5-turbo';
        
        if (gameId) {
          try {
            console.log(`[AudioHandler] Generating bot code from voice for gameId=${gameId}, model=${model}`);
            const result = await generateBotCodeService({
              userPrompt: text,
              model: model,
              gameId: gameId,
            });
            
            socket.emit('bot-code-generated', {
              code: result.code,
              transcript: text,
              model: result.model,
              tokensUsed: result.tokensUsed,
            });
          } catch (genError: any) {
            console.error('[AudioHandler] Bot code generation error:', genError);
            socket.emit('bot-code-generation-error', {
              error: genError?.message || 'Failed to generate bot code',
            });
          }
        } else {
          console.warn('[AudioHandler] No gameId in socket data, skipping bot code generation');
        }
      } catch (err: any) {
        socket.emit('transcription-error', {
          error: err?.message || 'Transcription failed',
        });
      } finally {
        delete sessions[socket.id];
      }
    });

    socket.on('disconnect', () => {
      console.log('[AudioHandler] Client disconnected:', socket.id);
      // Clean up if still active
      if (sessions[socket.id]) {
        sessions[socket.id]?.stream.destroy();
        delete sessions[socket.id];
      }
    });
  });
}