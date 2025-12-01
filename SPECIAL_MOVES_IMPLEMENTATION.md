# Special Moves & Conditions Implementation

## Overview
This document describes the architecture and implementation of special chess moves (castling, en passant, check detection) with extensibility for card-based modifications.

## Architecture

### 1. Type System (`src/types/chess.ts`)
Extended the `Move` interface to support special moves:
```typescript
export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  promotion?: PieceType;
  specialMove?: SpecialMoveType;      // NEW: Type of special move
  specialMoveData?: SpecialMoveData;  // NEW: Move-specific data
}
```

Special move types include:
- `castling_kingside` / `castling_queenside`
- `en_passant`
- `promotion`, `check`, `checkmate`, `stalemate` (for future implementation)

### 2. Special Moves Infrastructure (`src/utils/specialMoves/`)

#### Handler Interface (`types.ts`)
Each special move implements the `SpecialMoveHandler` interface:
- `isAvailable()` - Check if move is available for a piece
- `getValidPositions()` - Get valid destination squares
- `validate()` - Validate the move (e.g., can't castle through check)
- `execute()` - Execute the special move on the board

#### Context System
`SpecialMoveContext` tracks game state needed for special moves:
- `currentTurn` - Current player
- `moveHistory` - All previous moves
- `enPassantTarget` - Square available for en passant capture
- `castlingRights` - Castling availability for each player

### 3. Implemented Special Moves

#### Check Detection (`checkDetection.ts`)
Core functions for validating moves:
- `isSquareAttacked()` - Check if a square is under attack
- `isKingInCheck()` - Check if king is in check
- `filterMovesThatLeaveKingInCheck()` - Remove illegal moves

#### Castling (`handlers/castling.ts`)
Implements both kingside and queenside castling:
- Validates: King/rook haven't moved, no pieces between, not in/through check
- Executes: Moves both king and rook simultaneously
- Updates castling rights when king/rook moves

#### En Passant (`handlers/enPassant.ts`)
Implements pawn capture by passing:
- Validates: Opponent pawn moved two squares on previous turn
- Executes: Captures pawn on the square it passed over
- Tracks en passant target (valid for one turn only)

### 4. Integration Points

#### ChessEngine Updates
- `getValidMoves()` now accepts `SpecialMoveContext`
- Combines basic piece moves with special moves
- Filters all moves to prevent leaving king in check
- `makeMove()` handles special move execution

#### GameStateManager Updates
Tracks special move conditions:
- `enPassantTarget` - Updated after each pawn double-move
- `castlingRights` - Updated when king/rook moves or is captured
- `updateCastlingRights()` - Maintains castling availability
- `updateEnPassantTarget()` - Sets/clears en passant target

Special move detection in `makeMove()`:
```typescript
// Detect castling by king moving 2 squares
if (king moves 2 squares horizontally) {
  specialMove = 'castling_kingside' or 'castling_queenside'
}

// Detect en passant by pawn moving to en passant target
if (pawn moves to enPassantTarget) {
  specialMove = 'en_passant'
}
```

### 5. Extensibility for Cards

The architecture allows cards to:

1. **Add Special Moves**: Register new `SpecialMoveHandler` implementations
2. **Modify Existing Moves**: Temporarily change move availability
3. **Add Conditions**: Extend `SpecialMoveContext` with card-specific state

Example future card integration:
```typescript
// Card could add a "super castling" that works from any position
const superCastlingHandler: SpecialMoveHandler = {
  type: 'super_castling',
  isAvailable: (piece, engine, gameState) => {
    // Custom logic - no position restrictions
    return piece.type === 'king' && !gameState.hasUsedSuperCastling;
  },
  // ... implement other methods
};

// Register the handler dynamically
registerCardSpecialMove(superCastlingHandler);
```

## File Structure
```
src/
  types/
    chess.ts                      # Extended Move type
  utils/
    chessEngine.ts                # Integrated special moves
    gameState.ts                  # Tracks special move conditions
    specialMoves/
      index.ts                    # Registry and exports
      types.ts                    # Handler interface, context
      checkDetection.ts           # Check validation
      handlers/
        castling.ts               # Castling implementation
        enPassant.ts              # En passant implementation
```

## Key Design Principles

1. **Separation of Concerns**: Special moves are separate from piece movement logic
2. **Extensibility**: New special moves = new handler in registry
3. **Composability**: Cards can add/remove special moves dynamically
4. **Validation Chain**: Basic moves → Special moves → Check validation → Final valid moves
5. **State Tracking**: GameState tracks conditions needed (en passant target, castling rights)

## Testing Special Moves

### Castling
- Try moving king 2 squares toward rook (e8→g8 for black, e1→g1 for white)
- Should fail if: pieces between, king in check, passing through check, king/rook moved
- Should succeed when all conditions met

### En Passant
1. Move opponent pawn 2 squares from starting position
2. Your pawn should be able to capture diagonally to the square it passed over
3. Only valid for one turn

### Check
- Moves that would leave your king in check should be automatically filtered out
- King cannot move into check

## Future Enhancements

1. **Pawn Promotion**: Add UI for selecting promotion piece
2. **Checkmate Detection**: Detect when no legal moves remain
3. **Stalemate Detection**: Detect draw conditions
4. **Move Notation**: Standard chess notation for moves
5. **Card Integration**: Allow cards to register custom special moves
