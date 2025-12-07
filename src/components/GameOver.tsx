import React from 'react';
import { Color } from '../types/chess';
import './GameOver.css';

interface GameOverProps {
  winner: Color | null;
  onNewGame: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ winner, onNewGame }) => {
  if (!winner) return null;

  const loserText = winner === 'white' ? 'Black' : 'White';
  const message = winner === 'white' ? 'You Win!' : 'AI Wins!';

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <h2 className="game-over-title">Game Over</h2>
        <p className="game-over-message">
          {loserText} is in checkmate!
        </p>
        <p className="game-over-winner">{message}</p>
        <button className="game-over-button" onClick={onNewGame}>
          New Game
        </button>
      </div>
    </div>
  );
};

