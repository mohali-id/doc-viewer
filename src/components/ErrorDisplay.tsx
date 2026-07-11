import React from 'react';

interface ErrorDisplayProps {
  message: string;
  url?: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, url, onRetry }) => {
  return (
    <div className="error-display">
      <div className="error-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="24" cy="24" r="20" />
          <path d="M24 14v12M24 32v2" />
        </svg>
      </div>
      <p className="error-message">{message}</p>
      {url && <p className="error-url">URL: {url}</p>}
      {onRetry && (
        <button className="error-retry-btn" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
