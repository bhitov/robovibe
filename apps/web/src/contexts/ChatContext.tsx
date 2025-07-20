import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import type { Message, FileDisplay } from '@/sidebar'

interface StreamingMessage {
  id: string
  fullText: string
  files?: FileDisplay[]
}

interface ChatCtx {
  messages: Message[]
  isThinking: boolean
  addUserMsg: (text: string) => string
  startAssistantThinking: () => string
  updateAssistantMsg: (id: string, text: string) => void
  finishAssistantMsg: (id: string, text: string, files?: FileDisplay[]) => void
}

const ChatContext = createContext<ChatCtx | null>(null)

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const streamQueue = useRef<StreamingMessage[]>([])
  const currentlyStreaming = useRef<string | null>(null)

  const addUserMsg = useCallback((content: string) => {
    const id = crypto.randomUUID()
    setMessages((m) => [...m, { id, role: 'user', content }])
    return id
  }, [])

  const startAssistantThinking = useCallback(() => {
    const id = crypto.randomUUID()
    setIsThinking(true)
    setMessages((m) => [...m, { id, role: 'assistant', content: '', isStreaming: true }])
    return id
  }, [])

  const updateAssistantMsg = useCallback((id: string, content: string) => {
    setMessages((m) =>
      m.map((msg) => (msg.id === id ? { ...msg, content } : msg)),
    )
  }, [])

  const finishAssistantMsg = useCallback((id: string, content: string, files?: FileDisplay[]) => {
    setIsThinking(false)
    // Add to streaming queue
    streamQueue.current.push({ id, fullText: content, files })
  }, [])

  // Process streaming queue with always-on interval
  useEffect(() => {
    let streamingWordIndex = 0
    let currentStreamingMessage: StreamingMessage | null = null

    const processInterval = setInterval(() => {
      // If not currently streaming, check for new messages in queue
      if (!currentStreamingMessage && streamQueue.current.length > 0) {
        currentStreamingMessage = streamQueue.current.shift()!
        currentlyStreaming.current = currentStreamingMessage.id
        streamingWordIndex = 0
      }

      // If we have a message to stream, process it
      if (currentStreamingMessage) {
        const words = currentStreamingMessage.fullText.split(' ')
        
        if (streamingWordIndex < words.length) {
          // Stream next word
          const currentText = words.slice(0, streamingWordIndex + 1).join(' ')
          const messageId = currentStreamingMessage.id
          setMessages((m) =>
            m.map((msg) => 
              msg.id === messageId 
                ? { ...msg, content: currentText, isStreaming: true }
                : msg
            )
          )
          streamingWordIndex++
        } else {
          // Finished streaming this message
          const messageId = currentStreamingMessage.id
          const fullText = currentStreamingMessage.fullText
          const files = currentStreamingMessage.files
          setMessages((m) =>
            m.map((msg) => 
              msg.id === messageId 
                ? { ...msg, content: fullText, isStreaming: false, files: files }
                : msg
            )
          )
          currentlyStreaming.current = null
          currentStreamingMessage = null
          streamingWordIndex = 0
        }
      }
    }, 50) // Check every 50ms

    return () => {
      clearInterval(processInterval)
    }
  }, []) // Empty deps - runs once on mount

  return (
    <ChatContext.Provider value={{ messages, isThinking, addUserMsg, startAssistantThinking, updateAssistantMsg, finishAssistantMsg }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>')
  return ctx
}