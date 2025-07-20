import React, { useState, useCallback } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ErrorSection } from './ErrorSection';
import { useVoiceRecorder } from './VoiceRecorder';
import { Message, ContextPill, ChatMode } from '../types';
// External dependencies to be injected
import { useChat } from '@/contexts/ChatContext';
import { trpc } from '@/utils/trpc';
import { useGame } from '@/contexts/GameContext';
import { socket } from '@/utils/socket';

export const ChatSidebar: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'chat' | 'code'>('chat');
    const [inputValue, setInputValue] = useState('');
    const { messages, isThinking, addUserMsg, startAssistantThinking, updateAssistantMsg, finishAssistantMsg } = useChat();
    const [error, setError] = useState<string | null>(null);
    const [contextPills, setContextPills] = useState<ContextPill[]>([]);
    const [chatMode, setChatMode] = useState<ChatMode>('text');
    const [selectedModel, setSelectedModel] = useState<string>('gpt-3.5-turbo');
    const [voiceAssistantId, setVoiceAssistantId] = useState<string | null>(null);
    
    const generateBotMutation = trpc.game.generateBotCode.useMutation();
    const { gameState, currentGameId, playerId, playerInfo } = useGame();

    const handleSendMessage = async (model: string) => {
        if (!inputValue.trim()) return;
        
        // Check if we're in a game
        if (!currentGameId) {
            setError('You need to be in a game to generate bot code');
            setTimeout(() => setError(null), 5000);
            return;
        }

        // Add user message to context
        const userPrompt = inputValue.trim();
        addUserMsg(userPrompt);
        setInputValue('');
        setContextPills([]);
        
        // Start thinking state
        const assistId = startAssistantThinking();
        
        try {
            const result = await generateBotMutation.mutateAsync({
                userPrompt: userPrompt,
                model: model,
                gameId: currentGameId,
            });
            
            // Get player nickname and format it for filename
            const playerNickname = playerId && playerInfo && playerInfo[playerId]?.nickname || 'player';
            const formattedNickname = playerNickname.toLowerCase().replace(/\s+/g, '-');
            const filename = `${formattedNickname}-bot.tsx`;
            
            // Attach code as downloadable file in sidebar
            finishAssistantMsg(assistId, 'Here is your generated bot code.', [
                { path: `/bots/${filename}`, content: result.code, isOpen: false }
            ]);
            
            // Automatically submit the code to the game
            if (playerId) {
                socket.emit('set-bot-code', { 
                    playerId: playerId,
                    code: result.code
                });
            }
        } catch (error) {
            finishAssistantMsg(assistId, 'Failed to generate code. Try again.');
            console.error('Failed to generate code:', error);
        }
    };

    // Voice recording setup - hooks must be called unconditionally
    const voiceRecorder = useVoiceRecorder({
        playerId: playerId || '',
        gameId: currentGameId || '',
        selectedModel,
        onTranscriptionComplete: (transcript) => {
            console.log('Transcription complete:', transcript);
            // Add the transcribed text as a user message immediately
            addUserMsg(transcript);
            // Start thinking state after showing the transcript
            const assistId = startAssistantThinking();
            setVoiceAssistantId(assistId);
        },
        onBotCodeGenerated: (code, transcript) => {
            console.log('Bot code generated from voice:', code);
            
            // Get player nickname and format it for filename
            const playerNickname = playerId && playerInfo && playerInfo[playerId]?.nickname || 'player';
            const formattedNickname = playerNickname.toLowerCase().replace(/\s+/g, '-');
            const filename = `${formattedNickname}-bot.tsx`;
            
            // Finish the thinking state that was started after transcription
            if (voiceAssistantId) {
                finishAssistantMsg(voiceAssistantId, 'Here is your generated bot code from voice.', [
                    { path: `/bots/${filename}`, content: code, isOpen: false }
                ]);
                setVoiceAssistantId(null);
            }
            
            // Automatically submit the code to the game
            if (playerId) {
                socket.emit('set-bot-code', { 
                    playerId: playerId,
                    code: code
                });
            }
        },
        onError: (error) => {
            setError(error);
            setTimeout(() => setError(null), 5000);
            // Clear thinking state if there was an error
            if (voiceAssistantId) {
                finishAssistantMsg(voiceAssistantId, 'Voice recording failed: ' + error);
                setVoiceAssistantId(null);
            }
        }
    });

    const handleAudioSend = useCallback(() => {
        if (!currentGameId || !playerId) {
            setError('You need to be in a game to use voice recording');
            setTimeout(() => setError(null), 5000);
            return;
        }
        
        if (voiceRecorder.isRecording) {
            voiceRecorder.stopRecording();
        } else {
            voiceRecorder.startRecording();
        }
    }, [currentGameId, playerId, voiceRecorder]);

    return (
        <div className="chat-sidebar">
            <ChatHeader activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="chat-content">
                <div className="messages-area">
                    <ChatMessages 
                        messages={messages} 
                        isThinking={isThinking}
                    />
                </div>
                
                {error && <ErrorSection error={error} onDismiss={() => setError(null)} />}
                
                <ChatInput 
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSendMessage}
                    onAudioSend={handleAudioSend}
                    isThinking={isThinking}
                    isRecording={voiceRecorder.isRecording}
                    contextPills={contextPills}
                    setContextPills={setContextPills}
                    chatMode={chatMode}
                    setChatMode={setChatMode}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                />
            </div>
        </div>
    );
};