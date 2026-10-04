import React, { useState } from 'react';
import logoImg from '../assets/icono.png';

interface FantasmaLogoProps {
  className?: string;
  size?: number;
}

export const FantasmaLogo: React.FC<FantasmaLogoProps> = ({ className = '', size = 36 }) => {
  const [srcIndex, setSrcIndex] = useState<number>(0);

  // Fallback sources in case of environment resolution
  const sources = [
    logoImg,
    '/icono.png',
    'https://www.unfantasmaenelsistema.com/wp-content/uploads/2026/09/icono.png',
  ];

  const handleImgError = () => {
    if (srcIndex < sources.length - 1) {
      setSrcIndex(prev => prev + 1);
    }
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`} 
      style={{ width: size, height: size }}
    >
      <img
        src={sources[srcIndex]}
        alt="Un Fantasma En El Sistema"
        width={size}
        height={size}
        loading="eager"
        decoding="sync"
        onError={handleImgError}
        className="w-full h-full object-contain select-none drop-shadow-md"
      />
    </div>
  );
};
