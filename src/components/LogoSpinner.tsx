import React from 'react';
import logoIcon from '@/assets/logo-icon.png';

interface LogoSpinnerProps {
  size?: number;
  className?: string;
}

/**
 * Animated lion logo used as a luxury loading indicator.
 * Pulses with a subtle scale + opacity animation.
 */
const LogoSpinner = ({ size = 48, className = '' }: LogoSpinnerProps) => (
  <div className={`flex items-center justify-center ${className}`}>
    <img
      src={logoIcon}
      alt=""
      width={size}
      height={size}
      className="animate-logo-pulse"
      style={{ width: size, height: size }}
    />
  </div>
);

export default LogoSpinner;
