import { Color, Move, Piece } from '../types/chess';
import { ChessEngine } from './chessEngine';

export class AI {
  private color: Color;

  constructor(color: Color = 'black') {
    this.color = color;
  }

  getBestMove(chessEngine: ChessEngine): Move | null {
    const board = chessEngine.getBoard();
    const pieces: Piece[] = [];
    
    // Collect all AI pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === this.color) {
          pieces.push(piece);
        }
      }
    }

    // Simple AI: Try to capture, otherwise make a random valid move
    const captureMoves: Move[] = [];
    const allMoves: Move[] = [];

    for (const piece of pieces) {
      const validMoves = chessEngine.getValidMoves(piece);
      for (const moveTo of validMoves) {
        const targetPiece = chessEngine.getPieceAt(moveTo);
        const move: Move = {
          from: piece.position,
          to: moveTo,
          piece: { ...piece },
          capturedPiece: targetPiece ? { ...targetPiece } : undefined
        };

        if (targetPiece) {
          captureMoves.push(move);
        } else {
          allMoves.push(move);
        }
      }
    }

    // Prefer captures, otherwise random move
    const moves = captureMoves.length > 0 ? captureMoves : allMoves;
    if (moves.length === 0) return null;

    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return randomMove;
  }
}

