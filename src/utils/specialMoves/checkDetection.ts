import { Color, Piece, Position } from '../../types/chess';
import { ChessEngineHelper } from '../../pieces/pieceRegistry';
import { PIECE_REGISTRY } from '../../pieces/pieceRegistry';

/**
 * Check if a square is attacked by any piece of the given color
 */
export function isSquareAttacked(
  position: Position,
  byColor: Color,
  engine: ChessEngineHelper
): boolean {
  // Check all pieces on the board
  const board = engine.getBoard();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const validMoves = PIECE_REGISTRY[piece.type].getMoves(piece, engine);
        if (validMoves.some(move => move.row === position.row && move.col === position.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Check if the king of the given color is in check
 */
export function isKingInCheck(
  color: Color,
  engine: ChessEngineHelper
): boolean {
  // Find the king
  let kingPosition: Position | null = null;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = engine.getPieceAt({ row, col });
      if (piece && piece.type === 'king' && piece.color === color) {
        kingPosition = { row, col };
        break;
      }
    }
    if (kingPosition) break;
  }

  if (!kingPosition) return false;

  // Check if the king's square is attacked by the opponent
  const opponentColor: Color = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(kingPosition, opponentColor, engine);
}

/**
 * Filter out moves that would leave the king in check
 * Note: This function mutates the engine's board temporarily for testing.
 * The engine should be cloned before calling this if you need to preserve state.
 */
export function filterMovesThatLeaveKingInCheck(
  moves: Position[],
  piece: Piece,
  engine: ChessEngineHelper
): Position[] {
  const validMoves: Position[] = [];
  const from = piece.position;
  const board = engine.getBoard();

  for (const to of moves) {
    // Save original state
    const originalFromPiece = board[from.row][from.col];
    const originalToPiece = board[to.row][to.col];
    
    // Temporarily execute move
    board[from.row][from.col] = null;
    board[to.row][to.col] = { ...piece, position: to, hasMoved: true };

    // Check if this move leaves the king in check
    if (!isKingInCheck(piece.color, engine)) {
      validMoves.push(to);
    }

    // Restore board state
    board[from.row][from.col] = originalFromPiece;
    board[to.row][to.col] = originalToPiece;
  }

  return validMoves;
}
