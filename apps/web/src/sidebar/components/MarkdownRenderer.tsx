import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
    // Transform file paths in code blocks
    const transformedContent = content.replace(
        /^(.*?)\n```(\w+)\n/gm,
        (_, filePath, language) => `\`\`\`${language}:${filePath}\n`,
    );

    return (
        <div className={`markdown-content ${isStreaming ? 'streaming-text' : ''}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    pre: ({ children, ...props }) => (
                        <pre className="markdown-pre" {...props}>
                            {children}
                        </pre>
                    ),
                    code: ({ className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !className || !match;
                        return !isInline ? (
                            <code className={`markdown-code language-${match[1]}`} {...props}>
                                {children}
                            </code>
                        ) : (
                            <code className="markdown-inline-code" {...props}>
                                {children}
                            </code>
                        );
                    },
                    h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
                    h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
                    h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
                    p: ({ children }) => <p className="markdown-p">{children}</p>,
                    ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
                    ol: ({ children }) => <ol className="markdown-ol">{children}</ol>,
                    li: ({ children }) => <li className="markdown-li">{children}</li>,
                    blockquote: ({ children }) => <blockquote className="markdown-blockquote">{children}</blockquote>,
                    a: ({ href, children }) => (
                        <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    ),
                    table: ({ children }) => <table className="markdown-table">{children}</table>,
                    strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
                    em: ({ children }) => <em className="markdown-em">{children}</em>,
                }}
            >
                {transformedContent}
            </ReactMarkdown>
        </div>
    );
};