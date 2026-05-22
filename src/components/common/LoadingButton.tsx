import React from 'react';

interface LoadingButtonProps {
  onClick: () => void;
  isLoading: boolean;
  label: string;
  loadingLabel: string;
  className?: string;
  disabled?: boolean;
}

export const LoadingButton = React.memo(function LoadingButton({
  onClick, isLoading, label, loadingLabel, className, disabled
}: LoadingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={className}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {loadingLabel}
        </>
      ) : label}
    </button>
  );
});
