import { PieceType, Color, Piece, Position } from '../types/chess';

// Helper type for move calculation functions
export type MoveCalculator = (piece: Piece, engine: ChessEngineHelper) => Position[];

// Helper interface to provide chess engine functionality to move calculators
export interface ChessEngineHelper {
  getPieceAt(position: Position): Piece | null;
  isValidPosition(position: Position): boolean;
  getLinearMoves(piece: Piece, directions: { row: number; col: number }[]): Position[];
  getBoard(): (Piece | null)[][];
  clone?(): ChessEngineHelper; // Optional clone method for testing moves
}

export interface PieceDefinition {
  type: PieceType;
  symbol: { white: string; black: string };
  getMoves: MoveCalculator;
  startingPositions?: {
    white: { row: number; col: number }[];
    black: { row: number; col: number }[];
  };
}

// Move calculation functions
const getPawnMoves: MoveCalculator = (piece, engine) => {
  const moves: Position[] = [];
  const { row, col } = piece.position;
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;

  // Move forward one square
  const oneForward = { row: row + direction, col };
  if (engine.isValidPosition(oneForward) && !engine.getPieceAt(oneForward)) {
    moves.push(oneForward);
    
    // Move forward two squares from starting position
    if (row === startRow) {
      const twoForward = { row: row + 2 * direction, col };
      if (engine.isValidPosition(twoForward) && !engine.getPieceAt(twoForward)) {
        moves.push(twoForward);
      }
    }
  }

  // Capture diagonally
  const captureLeft = { row: row + direction, col: col - 1 };
  const captureRight = { row: row + direction, col: col + 1 };
  
  [captureLeft, captureRight].forEach(pos => {
    if (engine.isValidPosition(pos)) {
      const target = engine.getPieceAt(pos);
      if (target && target.color !== piece.color) {
        moves.push(pos);
      }
    }
  });

  return moves;
};

const getRookMoves: MoveCalculator = (piece, engine) => {
  return engine.getLinearMoves(piece, [
    { row: -1, col: 0 }, { row: 1, col: 0 },
    { row: 0, col: -1 }, { row: 0, col: 1 }
  ]);
};

const getBishopMoves: MoveCalculator = (piece, engine) => {
  return engine.getLinearMoves(piece, [
    { row: -1, col: -1 }, { row: -1, col: 1 },
    { row: 1, col: -1 }, { row: 1, col: 1 }
  ]);
};

const getKnightMoves: MoveCalculator = (piece, engine) => {
  const moves: Position[] = [];
  const { row, col } = piece.position;
  const offsets = [
    { row: -2, col: -1 }, { row: -2, col: 1 },
    { row: -1, col: -2 }, { row: -1, col: 2 },
    { row: 1, col: -2 }, { row: 1, col: 2 },
    { row: 2, col: -1 }, { row: 2, col: 1 }
  ];

  offsets.forEach(offset => {
    const pos = { row: row + offset.row, col: col + offset.col };
    if (engine.isValidPosition(pos)) {
      const target = engine.getPieceAt(pos);
      if (!target || target.color !== piece.color) {
        moves.push(pos);
      }
    }
  });

  return moves;
};

const getQueenMoves: MoveCalculator = (piece, engine) => {
  return [
    ...engine.getLinearMoves(piece, [
      { row: -1, col: 0 }, { row: 1, col: 0 },
      { row: 0, col: -1 }, { row: 0, col: 1 }
    ]),
    ...engine.getLinearMoves(piece, [
      { row: -1, col: -1 }, { row: -1, col: 1 },
      { row: 1, col: -1 }, { row: 1, col: 1 }
    ])
  ];
};

const getKingMoves: MoveCalculator = (piece, engine) => {
  const moves: Position[] = [];
  const { row, col } = piece.position;
  const offsets = [
    { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
    { row: 0, col: -1 }, { row: 0, col: 1 },
    { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
  ];

  offsets.forEach(offset => {
    const pos = { row: row + offset.row, col: col + offset.col };
    if (engine.isValidPosition(pos)) {
      const target = engine.getPieceAt(pos);
      if (!target || target.color !== piece.color) {
        moves.push(pos);
      }
    }
  });

  return moves;
};

// Piece Registry - All piece definitions in one place
export const PIECE_REGISTRY: Record<PieceType, PieceDefinition> = {
  pawn: {
    type: 'pawn',
    symbol: { white: '♙', black: '♟' },
    getMoves: getPawnMoves,
    startingPositions: {
      white: Array.from({ length: 8 }, (_, i) => ({ row: 6, col: i })),
      black: Array.from({ length: 8 }, (_, i) => ({ row: 1, col: i }))
    }
  },
  rook: {
    type: 'rook',
    symbol: { white: '♖', black: '♜' },
    getMoves: getRookMoves,
    startingPositions: {
      white: [{ row: 7, col: 0 }, { row: 7, col: 7 }],
      black: [{ row: 0, col: 0 }, { row: 0, col: 7 }]
    }
  },
  knight: {
    type: 'knight',
    symbol: { white: '♘', black: '♞' },
    getMoves: getKnightMoves,
    startingPositions: {
      white: [{ row: 7, col: 1 }, { row: 7, col: 6 }],
      black: [{ row: 0, col: 1 }, { row: 0, col: 6 }]
    }
  },
  bishop: {
    type: 'bishop',
    symbol: { white: '♗', black: '♝' },
    getMoves: getBishopMoves,
    startingPositions: {
      white: [{ row: 7, col: 2 }, { row: 7, col: 5 }],
      black: [{ row: 0, col: 2 }, { row: 0, col: 5 }]
    }
  },
  queen: {
    type: 'queen',
    symbol: { white: '♕', black: '♛' },
    getMoves: getQueenMoves,
    startingPositions: {
      white: [{ row: 7, col: 3 }],
      black: [{ row: 0, col: 3 }]
    }
  },
  king: {
    type: 'king',
    symbol: { white: '♔', black: '♚' },
    getMoves: getKingMoves,
    startingPositions: {
      white: [{ row: 7, col: 4 }],
      black: [{ row: 0, col: 4 }]
    }
  }
};

// Helper function to get piece symbol
export function getPieceSymbol(piece: Piece): string {
  return PIECE_REGISTRY[piece.type].symbol[piece.color];
}

// Helper function to get all piece types
export function getAllPieceTypes(): PieceType[] {
  return Object.keys(PIECE_REGISTRY) as PieceType[];
}

// Helper function to get initial board setup
export function getInitialBoardSetup(): { type: PieceType; color: Color; position: Position }[] {
  const setup: { type: PieceType; color: Color; position: Position }[] = [];
  
  for (const pieceType of getAllPieceTypes()) {
    const definition = PIECE_REGISTRY[pieceType];
    if (definition.startingPositions) {
      definition.startingPositions.white.forEach(pos => {
        setup.push({ type: pieceType, color: 'white', position: pos });
      });
      definition.startingPositions.black.forEach(pos => {
        setup.push({ type: pieceType, color: 'black', position: pos });
      });
    }
  }
  
  return setup;
}

