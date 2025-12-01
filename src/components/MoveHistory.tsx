import React from 'react';
import { Move } from '../types/chess';
import './MoveHistory.css';

interface MoveHistoryProps {
  moves: Move[];
  onUndo: () => void;
  canUndo: boolean;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ moves, onUndo, canUndo }) => {
  const formatPosition = (row: number, col: number): string => {
    const file = String.fromCharCode(97 + col); // a-h
    const rank = 8 - row; // 1-8
    return `${file}${rank}`;
  };

  return (
    <div className="move-history">
      <div className="move-history-header">
        <h3>Move History</h3>
        <button onClick={onUndo} disabled={!canUndo} className="undo-button">
          Undo
        </button>
      </div>
      <div className="moves-list">
        {moves.length === 0 ? (
          <p className="no-moves">No moves yet</p>
        ) : (
          moves.map((move, index) => (
            <div key={index} className="move-item">
              <span className="move-number">{index + 1}.</span>
              <span className="move-notation">
                {formatPosition(move.from.row, move.from.col)} → {formatPosition(move.to.row, move.to.col)}
              </span>
              {move.capturedPiece && (
                <span className="capture-indicator">×</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

