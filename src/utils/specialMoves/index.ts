import { SpecialMoveHandler, SpecialMoveType } from './types';
import { castlingKingsideHandler, castlingQueensideHandler } from './handlers/castling';
import { enPassantHandler } from './handlers/enPassant';

// Registry of all special move handlers
// Note: Only implemented handlers are included. Others (promotion, check, checkmate, stalemate) 
// are handled separately or are game state conditions, not moves.
const SPECIAL_MOVE_REGISTRY: Partial<Record<SpecialMoveType, SpecialMoveHandler>> = {
  castling_kingside: castlingKingsideHandler,
  castling_queenside: castlingQueensideHandler,
  en_passant: enPassantHandler,
};

export function getSpecialMoveHandler(type: SpecialMoveType): SpecialMoveHandler | undefined {
  return SPECIAL_MOVE_REGISTRY[type];
}

export function getAllSpecialMoveHandlers(): SpecialMoveHandler[] {
  return Object.values(SPECIAL_MOVE_REGISTRY);
}

export * from './types';
export * from './checkDetection';
export * from './handlers/castling';
export * from './handlers/enPassant';
