import { Color, Piece, Position, Move } from '../../types/chess';
import { ChessEngineHelper } from '../../pieces/pieceRegistry';

export interface SpecialMoveContext {
  currentTurn: Color;
  moveHistory: Move[];
  enPassantTarget?: Position; // For en passant - the square the pawn passed over
  castlingRights: {
    white: { kingside: boolean; queenside: boolean };
    black: { kingside: boolean; queenside: boolean };
  };
}

export interface SpecialMoveHandler {
  type: SpecialMoveType;
  
  // Check if this special move is available for the given piece/position
  isAvailable: (
    piece: Piece, 
    engine: ChessEngineHelper, 
    gameState: SpecialMoveContext
  ) => boolean;
  
  // Get the valid positions for this special move
  getValidPositions: (
    piece: Piece,
    engine: ChessEngineHelper,
    gameState: SpecialMoveContext
  ) => Position[];
  
  // Execute the special move (modify board state)
  execute: (
    move: Move,
    engine: ChessEngineHelper,
    gameState?: SpecialMoveContext
  ) => boolean;
  
  // Validate if the move is legal (e.g., can't castle through check)
  validate: (
    move: Move,
    engine: ChessEngineHelper,
    gameState?: SpecialMoveContext
  ) => boolean;
}

export type SpecialMoveType = 
  | 'castling_kingside'
  | 'castling_queenside'
  | 'en_passant'
  | 'promotion'
  | 'check'
  | 'checkmate'
  | 'stalemate';
