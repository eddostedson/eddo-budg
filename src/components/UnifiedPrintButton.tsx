import React, { useState } from 'react';

interface UnifiedPrintButtonProps {
  onPrint: (orientation: 'portrait' | 'landscape') => void;
  disabled?: boolean;
  className?: string;
}

export const UnifiedPrintButton: React.FC<UnifiedPrintButtonProps> = ({
  onPrint,
  disabled = false,
  className = ''
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const handlePrint = (orientation: 'portrait' | 'landscape') => {
    onPrint(orientation);
    setShowOptions(false);
  };

  return (
    <div className="relative">
      {/* Bouton principal */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={disabled}
        className={`bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${className}`}
      >
        🖨️ Impression
        <span className={`transform transition-transform duration-200 ${showOptions ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Menu déroulant */}
      {showOptions && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 min-w-[140px]">
          <button
            onClick={() => handlePrint('portrait')}
            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-3"
          >
            <span className="text-lg">📄</span>
            <div>
              <div className="font-medium">Portrait</div>
              <div className="text-xs text-gray-500">Format vertical</div>
            </div>
          </button>
          
          <div className="border-t border-gray-200"></div>
          
          <button
            onClick={() => handlePrint('landscape')}
            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-3"
          >
            <span className="text-lg">📋</span>
            <div>
              <div className="font-medium">Paysage</div>
              <div className="text-xs text-gray-500">Format horizontal</div>
            </div>
          </button>
        </div>
      )}

      {/* Overlay pour fermer le menu */}
      {showOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
};

export default UnifiedPrintButton;



















