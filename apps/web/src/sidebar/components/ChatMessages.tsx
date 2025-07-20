import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { CollapsibleFile } from './CollapsibleFile';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessagesProps {
    messages?: Message[];
    isThinking?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages: propMessages, isThinking: propIsThinking }) => {
    // Try to import useChat, fall back to props if not available
    let contextMessages: Message[] = [];
    let contextIsThinking = false;
    
    try {
        const { useChat } = require('@/contexts/ChatContext');
        const chat = useChat();
        contextMessages = chat.messages;
        contextIsThinking = chat.isThinking;
    } catch {
        // useChat not available, use props
    }
    
    const messages = propMessages ?? contextMessages;
    const isThinking = propIsThinking ?? contextIsThinking;
    
    const [fileStates, setFileStates] = useState<Record<string, Record<number, boolean>>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const toggleFile = (messageId: string, fileIndex: number) => {
        setFileStates(prev => ({
            ...prev,
            [messageId]: {
                ...prev[messageId],
                [fileIndex]: !prev[messageId]?.[fileIndex]
            }
        }));
    };
    
    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    return (
        <>
            {messages.map((message) => (
                <div key={message.id} className="message">
                    {message.role === 'assistant' ? (
                        <div className="assistant-message">
                            <MarkdownRenderer 
                                content={message.content} 
                                isStreaming={message.isStreaming}
                            />
                            
                            {message.toolCalls?.map((toolCall, idx) => (
                                <div key={idx} className="tool-call">
                                    <div className="tool-call-header">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <span>Searching for files</span>
                                    </div>
                                    <div className="tool-call-content">{toolCall.query}</div>
                                </div>
                            ))}
                            
                            {message.files?.map((file, idx) => (
                                <CollapsibleFile
                                    key={idx}
                                    file={{
                                        ...file,
                                        isOpen: fileStates[message.id]?.[idx] ?? file.isOpen
                                    }}
                                    onToggle={() => toggleFile(message.id, idx)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="user-message">
                            <div className="user-message-content">
                                {message.content}
                            </div>
                        </div>
                    )}
                </div>
            ))}
            
            {isThinking && (
                <div className="thinking-indicator">
                    <svg className="loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Thinking ...</span>
                </div>
            )}
            <div ref={messagesEndRef} />
        </>
    );
};