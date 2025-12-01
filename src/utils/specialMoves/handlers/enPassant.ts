import { isKingInCheck } from '../checkDetection';
import type { SpecialMoveHandler } from '../types';

// Types used: Piece, Position, Move
export const enPassantHandler: SpecialMoveHandler = {
  type: 'en_passant',

  isAvailable: (piece, _engine, gameState) => {
    // Only available for pawns
    if (piece.type !== 'pawn') return false;
    
    // Must have an en passant target
    if (!gameState.enPassantTarget) return false;
    
    // The en passant target must be adjacent to this pawn
    const { row, col } = piece.position;
    const target = gameState.enPassantTarget;
    const direction = piece.color === 'white' ? -1 : 1;
    
    // Check if the en passant target is diagonally forward from this pawn
    return (
      target.row === row + direction &&
      (target.col === col - 1 || target.col === col + 1)
    );
  },

  getValidPositions: (piece, engine, gameState) => {
    if (!enPassantHandler.isAvailable(piece, engine, gameState) || !gameState.enPassantTarget) {
      return [];
    }

    const target = gameState.enPassantTarget;
    
    // The en passant capture square is the target square itself
    return [target];
  },

  validate: (move, engine) => {
    if (!move.specialMoveData?.enPassant) return false;
    
    // En passant is always valid if available (it's a capture move)
    // Additional validation: ensure the captured pawn is actually there
    const capturedPos = move.specialMoveData.enPassant.capturedPawnPosition;
    const capturedPiece = engine.getPieceAt(capturedPos);
    
    if (!capturedPiece || capturedPiece.type !== 'pawn' || capturedPiece.color === move.piece.color) {
      return false;
    }

    // Check that this move doesn't leave the king in check
    const board = engine.getBoard();
    const from = move.from;
    const to = move.to;
    
    // Save state
    const originalFromPiece = board[from.row][from.col];
    const originalToPiece = board[to.row][to.col];
    const originalCapturedPiece = board[capturedPos.row][capturedPos.col];
    
    // Test move
    board[from.row][from.col] = null;
    board[to.row][to.col] = { ...move.piece, position: to, hasMoved: true };
    board[capturedPos.row][capturedPos.col] = null;
    
    const isValid = !isKingInCheck(move.piece.color, engine);
    
    // Restore state
    board[from.row][from.col] = originalFromPiece;
    board[to.row][to.col] = originalToPiece;
    board[capturedPos.row][capturedPos.col] = originalCapturedPiece;
    
    return isValid;
  },

  execute: (move, engine) => {
    if (!move.specialMoveData?.enPassant) return false;
    
    const board = engine.getBoard();
    const from = move.from;
    const to = move.to;
    const capturedPos = move.specialMoveData.enPassant.capturedPawnPosition;
    
    // Move the pawn
    board[from.row][from.col] = null;
    board[to.row][to.col] = { ...move.piece, position: to, hasMoved: true };
    
    // Remove the captured pawn
    board[capturedPos.row][capturedPos.col] = null;
    
    return true;
  }
};
