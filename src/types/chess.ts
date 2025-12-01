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

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  promotion?: PieceType;
}

export interface BoardState {
  pieces: Piece[];
  currentTurn: Color;
  moveHistory: Move[];
  isCheck: { white: boolean; black: boolean };
  isCheckmate: { white: boolean; black: boolean };
}

