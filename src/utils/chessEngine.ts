import { Position, Piece, Move, BoardState } from '../types/chess';
import { PIECE_REGISTRY, getInitialBoardSetup, ChessEngineHelper } from '../pieces/pieceRegistry';

export class ChessEngine implements ChessEngineHelper {
  private board: (Piece | null)[][];

  constructor() {
    this.board = this.createInitialBoard();
  }

  private createInitialBoard(): (Piece | null)[][] {
    const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Use piece registry to set up initial board
    const initialSetup = getInitialBoardSetup();
    initialSetup.forEach(({ type, color, position }) => {
      board[position.row][position.col] = {
        type,
        color,
        position: { ...position }
      };
    });

    return board;
  }

  getBoard(): (Piece | null)[][] {
    return this.board;
  }

  getPieceAt(position: Position): Piece | null {
    if (this.isValidPosition(position)) {
      return this.board[position.row][position.col];
    }
    return null;
  }

  isValidPosition(position: Position): boolean {
    return position.row >= 0 && position.row < 8 && position.col >= 0 && position.col < 8;
  }

  getValidMoves(piece: Piece): Position[] {
    const pieceDefinition = PIECE_REGISTRY[piece.type];
    if (!pieceDefinition) {
      return [];
    }
    return pieceDefinition.getMoves(piece, this);
  }

  getLinearMoves(piece: Piece, directions: { row: number; col: number }[]): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;

    directions.forEach(dir => {
      for (let i = 1; i < 8; i++) {
        const pos = { row: row + dir.row * i, col: col + dir.col * i };
        if (!this.isValidPosition(pos)) break;

        const target = this.getPieceAt(pos);
        if (!target) {
          moves.push(pos);
        } else {
          if (target.color !== piece.color) {
            moves.push(pos);
          }
          break;
        }
      }
    });

    return moves;
  }

  makeMove(move: Move): boolean {
    const { from, to, piece } = move;

    // Validate move
    const validMoves = this.getValidMoves(piece);
    const isValid = validMoves.some(m => m.row === to.row && m.col === to.col);
    
    if (!isValid) return false;

    // Execute move
    this.board[from.row][from.col] = null;
    this.board[to.row][to.col] = { ...piece, position: to, hasMoved: true };

    return true;
  }

  getBoardState(): BoardState {
    const pieces: Piece[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece) {
          pieces.push(piece);
        }
      }
    }

    return {
      pieces,
      currentTurn: 'white', // This will be managed by GameState
      moveHistory: [],
      isCheck: { white: false, black: false },
      isCheckmate: { white: false, black: false }
    };
  }

  clone(): ChessEngine {
    const cloned = new ChessEngine();
    cloned.board = this.board.map(row => row.map(piece => piece ? { ...piece } : null));
    return cloned;
  }
}

