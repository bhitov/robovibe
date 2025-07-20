import React from 'react';

interface ErrorSectionProps {
    error: string;
    onDismiss: () => void;
}

export const ErrorSection: React.FC<ErrorSectionProps> = ({ error, onDismiss }) => {
    return (
        <div className="error-section">
            <span>{error}</span>
            <button className="error-dismiss" onClick={onDismiss}>×</button>
        </div>
    );
};