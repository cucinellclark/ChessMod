import React from 'react';
import { Piece } from '../types/chess';
import { getPieceSymbol } from '../pieces/pieceRegistry';
import './Piece.css';

interface PieceProps {
  piece: Piece;
}

export const PieceComponent: React.FC<PieceProps> = ({ piece }) => {
  const symbol = getPieceSymbol(piece);

  return (
    <div className={`piece piece-${piece.color}`}>
      {symbol}
    </div>
  );
};

