import { isSquareAttacked, isKingInCheck } from '../checkDetection';
import type { SpecialMoveHandler } from '../types';

// Types used: Piece, Position, Move
export const castlingKingsideHandler: SpecialMoveHandler = {
  type: 'castling_kingside',

  isAvailable: (piece, engine, gameState) => {
    // Only available for kings
    if (piece.type !== 'king') return false;
    
    // King must not have moved
    if (piece.hasMoved) return false;
    
    // Check castling rights
    const rights = gameState.castlingRights[piece.color];
    if (!rights.kingside) return false;
    
    // King must not be in check
    if (isKingInCheck(piece.color, engine)) return false;
    
    // Check if squares between king and rook are empty
    const row = piece.position.row;
    const kingCol = piece.position.col;
    const rookCol = 7; // Kingside rook
    
    // Squares between king and rook (for white: e1-f1-g1, for black: e8-f8-g8)
    for (let col = kingCol + 1; col < rookCol; col++) {
      if (engine.getPieceAt({ row, col })) {
        return false; // Square is occupied
      }
    }
    
    // Check if rook exists and hasn't moved
    const rook = engine.getPieceAt({ row, col: rookCol });
    if (!rook || rook.type !== 'rook' || rook.color !== piece.color || rook.hasMoved) {
      return false;
    }
    
    return true;
  },

  getValidPositions: (piece, engine, gameState) => {
    if (!castlingKingsideHandler.isAvailable(piece, engine, gameState)) {
      return [];
    }
    
    // Kingside castling: king moves two squares toward the rook
    const row = piece.position.row;
    const kingCol = piece.position.col;
    return [{ row, col: kingCol + 2 }];
  },

  validate: (move, engine) => {
    if (!move.specialMoveData?.castling) return false;
    
    const piece = move.piece;
    const from = move.from;
    const to = move.to;
    
    // King must not pass through check
    const row = from.row;
    const kingCol = from.col;
    
    // Check the square the king moves through (one square toward rook)
    const intermediateSquare = { row, col: kingCol + 1 };
    if (isSquareAttacked(intermediateSquare, piece.color === 'white' ? 'black' : 'white', engine)) {
      return false;
    }
    
    // Check the destination square
    if (isSquareAttacked(to, piece.color === 'white' ? 'black' : 'white', engine)) {
      return false;
    }
    
    return true;
  },

  execute: (move, engine) => {
    if (!move.specialMoveData?.castling) return false;
    
    const board = engine.getBoard();
    const from = move.from;
    const to = move.to;
    const rookFrom = move.specialMoveData.castling.rookFrom;
    const rookTo = move.specialMoveData.castling.rookTo;
    
    // Move king
    const king = board[from.row][from.col];
    board[from.row][from.col] = null;
    board[to.row][to.col] = { ...king!, position: to, hasMoved: true };
    
    // Move rook
    const rook = board[rookFrom.row][rookFrom.col];
    board[rookFrom.row][rookFrom.col] = null;
    board[rookTo.row][rookTo.col] = { ...rook!, position: rookTo, hasMoved: true };
    
    return true;
  }
};

export const castlingQueensideHandler: SpecialMoveHandler = {
  type: 'castling_queenside',

  isAvailable: (piece, engine, gameState) => {
    // Only available for kings
    if (piece.type !== 'king') return false;
    
    // King must not have moved
    if (piece.hasMoved) return false;
    
    // Check castling rights
    const rights = gameState.castlingRights[piece.color];
    if (!rights.queenside) return false;
    
    // King must not be in check
    if (isKingInCheck(piece.color, engine)) return false;
    
    // Check if squares between king and rook are empty
    const row = piece.position.row;
    const kingCol = piece.position.col;
    const rookCol = 0; // Queenside rook
    
    // Squares between king and rook (for white: e1-d1-c1-b1, for black: e8-d8-c8-b8)
    for (let col = rookCol + 1; col < kingCol; col++) {
      if (engine.getPieceAt({ row, col })) {
        return false; // Square is occupied
      }
    }
    
    // Check if rook exists and hasn't moved
    const rook = engine.getPieceAt({ row, col: rookCol });
    if (!rook || rook.type !== 'rook' || rook.color !== piece.color || rook.hasMoved) {
      return false;
    }
    
    return true;
  },

  getValidPositions: (piece, engine, gameState) => {
    if (!castlingQueensideHandler.isAvailable(piece, engine, gameState)) {
      return [];
    }
    
    // Queenside castling: king moves two squares toward the rook
    const row = piece.position.row;
    const kingCol = piece.position.col;
    return [{ row, col: kingCol - 2 }];
  },

  validate: (move, engine) => {
    if (!move.specialMoveData?.castling) return false;
    
    const piece = move.piece;
    const from = move.from;
    const to = move.to;
    
    // King must not pass through check
    const row = from.row;
    const kingCol = from.col;
    
    // Check the square the king moves through (one square toward rook)
    const intermediateSquare = { row, col: kingCol - 1 };
    if (isSquareAttacked(intermediateSquare, piece.color === 'white' ? 'black' : 'white', engine)) {
      return false;
    }
    
    // Check the destination square
    if (isSquareAttacked(to, piece.color === 'white' ? 'black' : 'white', engine)) {
      return false;
    }
    
    return true;
  },

  execute: (move, engine) => {
    if (!move.specialMoveData?.castling) return false;
    
    const board = engine.getBoard();
    const from = move.from;
    const to = move.to;
    const rookFrom = move.specialMoveData.castling.rookFrom;
    const rookTo = move.specialMoveData.castling.rookTo;
    
    // Move king
    const king = board[from.row][from.col];
    board[from.row][from.col] = null;
    board[to.row][to.col] = { ...king!, position: to, hasMoved: true };
    
    // Move rook
    const rook = board[rookFrom.row][rookFrom.col];
    board[rookFrom.row][rookFrom.col] = null;
    board[rookTo.row][rookTo.col] = { ...rook!, position: rookTo, hasMoved: true };
    
    return true;
  }
};
