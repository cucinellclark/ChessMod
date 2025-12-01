export type Color = 'white' | 'black';
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  type: PieceType;
  color: Color;
  position: Position;
  hasMoved?: boolean;
}

export type SpecialMoveType = 
  | 'castling_kingside'
  | 'castling_queenside'
  | 'en_passant'
  | 'promotion'
  | 'check'
  | 'checkmate'
  | 'stalemate';

export interface SpecialMoveData {
  castling?: {
    rookFrom: Position;
    rookTo: Position;
  };
  enPassant?: {
    capturedPawnPosition: Position; // The pawn being captured
  };
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  promotion?: PieceType;
  specialMove?: SpecialMoveType;
  specialMoveData?: SpecialMoveData;
}

export interface BoardState {
  pieces: Piece[];
  currentTurn: Color;
  moveHistory: Move[];
  isCheck: { white: boolean; black: boolean };
  isCheckmate: { white: boolean; black: boolean };
}

