import React from 'react';

interface LoadingIndicatorProps {
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-indicator">
      <div className="spinner" />
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
