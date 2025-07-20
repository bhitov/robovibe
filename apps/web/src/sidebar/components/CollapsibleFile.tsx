import React, { useState } from 'react';
import { FileDisplay } from '../types';

interface CollapsibleFileProps {
    file: FileDisplay;
    onToggle: () => void;
}

export const CollapsibleFile: React.FC<CollapsibleFileProps> = ({ file, onToggle }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(file.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getFileName = (path: string) => {
        const parts = path.split('/');
        return parts[parts.length - 1] || path;
    };

    return (
        <div className="collapsible-file">
            <div className="file-header" onClick={onToggle}>
                <div className="file-header-content">
                    <svg className={`file-chevron ${file.isOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="file-name">{getFileName(file.path)}</span>
                </div>
            </div>
            
            <div className={`file-content ${file.isOpen ? 'open' : ''}`}>
                <pre className="code-block">{file.content}</pre>
                <div className="file-actions">
                    <button className="file-action-button" onClick={copyToClipboard}>
                        {copied ? (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};