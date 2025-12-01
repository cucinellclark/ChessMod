import React from 'react';
import { Position, Piece } from '../types/chess';
import { PieceComponent } from './Piece';
import './Board.css';

interface BoardProps {
  board: (Piece | null)[][];
  selectedPiece: Piece | null;
  validMoves: Position[];
  onSquareClick: (position: Position) => void;
}

export const Board: React.FC<BoardProps> = ({ board, selectedPiece, validMoves, onSquareClick }) => {
  const isSelected = (position: Position): boolean => {
    return selectedPiece?.position.row === position.row && selectedPiece?.position.col === position.col;
  };

  const isValidMove = (position: Position): boolean => {
    return validMoves.some(move => move.row === position.row && move.col === position.col);
  };

  const getSquareColor = (row: number, col: number): string => {
    const isLight = (row + col) % 2 === 0;
    return isLight ? 'light' : 'dark';
  };

  return (
    <div className="board">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((piece, colIndex) => {
            const position: Position = { row: rowIndex, col: colIndex };
            const squareColor = getSquareColor(rowIndex, colIndex);
            const selected = isSelected(position);
            const validMove = isValidMove(position);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`square square-${squareColor} ${selected ? 'selected' : ''} ${validMove ? 'valid-move' : ''}`}
                onClick={() => onSquareClick(position)}
              >
                {piece && <PieceComponent piece={piece} />}
                {validMove && !piece && <div className="move-indicator" />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

