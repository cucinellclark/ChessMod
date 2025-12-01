import React, { useEffect, useState } from 'react';
import { Color } from '../types/chess';
import './Timer.css';

interface TimerProps {
  currentTurn: Color;
  isActive: boolean;
}

export const Timer: React.FC<TimerProps> = ({ currentTurn, isActive }) => {
  const [whiteTime, setWhiteTime] = useState(600); // 10 minutes in seconds
  const [blackTime, setBlackTime] = useState(600);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (currentTurn === 'white') {
        setWhiteTime(prev => Math.max(0, prev - 1));
      } else {
        setBlackTime(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTurn, isActive]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer">
      <div className={`timer-player ${currentTurn === 'white' ? 'active' : ''}`}>
        <div className="timer-label">White</div>
        <div className="timer-value">{formatTime(whiteTime)}</div>
      </div>
      <div className={`timer-player ${currentTurn === 'black' ? 'active' : ''}`}>
        <div className="timer-label">Black</div>
        <div className="timer-value">{formatTime(blackTime)}</div>
      </div>
    </div>
  );
};

