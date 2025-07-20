import React, { useState, useRef, useEffect } from 'react';
import { ContextPill, ChatMode } from '../types';
import { models } from '@repo/game-config';
import { clientEnvConfig } from '@repo/config/client-env';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: (model: string) => void;
    onAudioSend?: () => void;
    isThinking: boolean;
    isRecording?: boolean;
    contextPills: ContextPill[];
    setContextPills: React.Dispatch<React.SetStateAction<ContextPill[]>>;
    chatMode: ChatMode;
    setChatMode: React.Dispatch<React.SetStateAction<ChatMode>>;
    selectedModel: string;
    setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChange,
    onSend,
    onAudioSend,
    isThinking,
    isRecording = false,
    contextPills,
    setContextPills,
    chatMode,
    setChatMode,
    selectedModel,
    setSelectedModel
}) => {
    const [showModeMenu, setShowModeMenu] = useState(false);
    const [showModelMenu, setShowModelMenu] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isVoiceOnly = clientEnvConfig.voiceOnly;

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);
    
    // Force vibe mode when voice-only is enabled
    useEffect(() => {
        if (isVoiceOnly && chatMode !== 'vibe') {
            setChatMode('vibe');
        }
    }, [isVoiceOnly, chatMode, setChatMode]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Don't send in voice-only mode
            if (!isVoiceOnly) {
                onSend(selectedModel);
            }
        }
    };

    const handleScreenshot = () => {
        // Simulate adding a screenshot
        const newPill: ContextPill = {
            id: Date.now().toString(),
            type: 'image',
            name: 'Screenshot.png'
        };
        setContextPills([...contextPills, newPill]);
    };

    const removePill = (id: string) => {
        setContextPills(contextPills.filter(pill => pill.id !== id));
    };

    const modes: { value: ChatMode; label: string }[] = [
        { value: 'text', label: 'Text Mode' },
        { value: 'vibe', label: 'Vibe Mode' }
    ];
    
    const modelKeys = Object.keys(models) as Array<keyof typeof models>;

    return (
        <div className="chat-input-container">
            {contextPills.length > 0 && (
                <div className="context-pills">
                    {contextPills.map((pill) => (
                        <div key={pill.id} className="context-pill">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                {pill.type === 'file' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                )}
                            </svg>
                            <span>{pill.name}</span>
                            <button onClick={() => removePill(pill.id)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="input-wrapper">
                <textarea
                    ref={textareaRef}
                    value={isVoiceOnly ? "Voice-only mode: Click the microphone to speak" : value}
                    onChange={(e) => !isVoiceOnly && onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isVoiceOnly ? "Voice-only mode active" : "Tell your bot what to do"}
                    className={`chat-textarea ${isVoiceOnly ? 'voice-only' : ''}`}
                    rows={2}
                    readOnly={isVoiceOnly}
                />
                
                <div className="input-actions">
                    <div className="input-left-actions">
                        {!isVoiceOnly && (
                            <button className="action-button" onClick={handleScreenshot} title="Take screenshot">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        )}
                        
                        {!isVoiceOnly && (
                            <div className="mode-dropdown">
                                <button className="mode-button" onClick={() => { setShowModeMenu(!showModeMenu); setShowModelMenu(false); }}>
                                {modes.find(m => m.value === chatMode)?.label}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showModeMenu && (
                                <div className="mode-menu">
                                    {modes.map((mode) => (
                                        <button
                                            key={mode.value}
                                            className={`mode-option ${chatMode === mode.value ? 'active' : ''}`}
                                            onClick={() => {
                                                setChatMode(mode.value);
                                                setShowModeMenu(false);
                                            }}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        )}
                        
                        <div className="mode-dropdown">
                            <button className="mode-button" onClick={() => { setShowModelMenu(!showModelMenu); setShowModeMenu(false); }}>
                                {selectedModel}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showModelMenu && (
                                <div className="mode-menu">
                                    {modelKeys.map((modelKey) => (
                                        <button
                                            key={modelKey}
                                            className={`mode-option ${selectedModel === modelKey ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedModel(modelKey);
                                                setShowModelMenu(false);
                                            }}
                                        >
                                            {modelKey}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <button 
                        className={`send-button ${isThinking ? 'stop-button' : ''} ${isRecording ? 'recording' : ''}`}
                        onClick={() => {
                            if (chatMode === 'vibe' && onAudioSend) {
                                onAudioSend();
                            } else {
                                onSend(selectedModel);
                            }
                        }}
                        disabled={isVoiceOnly ? isThinking : (chatMode === 'text' ? (!value.trim() && !isThinking) : isThinking)}
                    >
                        {isThinking ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="6" y="6" width="12" height="12" strokeWidth={2} />
                            </svg>
                        ) : chatMode === 'vibe' ? (
                            isRecording ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="6" y="6" width="12" height="12" strokeWidth={2} />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};