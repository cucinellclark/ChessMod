import { Color, Move, Piece, Position } from '../types/chess';
import { Card } from '../types/cards';
import { ChessEngine } from './chessEngine';
import { CardSystem } from './cardSystem';
import { SpecialMoveContext } from './specialMoves';

export interface GameState {
  chessEngine: ChessEngine;
  cardSystem: CardSystem;
  currentTurn: Color;
  selectedPiece: Piece | null;
  validMoves: Position[];
  moveHistory: Move[];
  canUndo: boolean;
  isCardActive: boolean;
  activeCard: Card | null;
  remainingMoves: number; // For move_twice card
  protectedPieces: Map<string, number>; // Piece position -> turns remaining
  hasExtraTurn: boolean; // For extra_turn card
  pendingTeleport: boolean; // For teleport card
  pendingSwap: boolean; // For swap_pieces card
  enPassantTarget?: Position; // Square available for en passant capture
  castlingRights: {
    white: { kingside: boolean; queenside: boolean };
    black: { kingside: boolean; queenside: boolean };
  };
}

export class GameStateManager {
  private state: GameState;

  constructor() {
    this.state = {
      chessEngine: new ChessEngine(),
      cardSystem: new CardSystem(),
      currentTurn: 'white',
      selectedPiece: null,
      validMoves: [],
      moveHistory: [],
      canUndo: false,
      isCardActive: false,
      activeCard: null,
      remainingMoves: 1,
      protectedPieces: new Map(),
      hasExtraTurn: false,
      pendingTeleport: false,
      pendingSwap: false,
      enPassantTarget: undefined,
      castlingRights: {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
      }
    };
  }

  private getSpecialMoveContext(): SpecialMoveContext {
    return {
      currentTurn: this.state.currentTurn,
      moveHistory: this.state.moveHistory,
      enPassantTarget: this.state.enPassantTarget,
      castlingRights: this.state.castlingRights
    };
  }

  getState(): GameState {
    return { 
      ...this.state,
      protectedPieces: new Map(this.state.protectedPieces)
    };
  }

  selectPiece(piece: Piece | null): void {
    if (!piece) {
      this.state.selectedPiece = null;
      this.state.validMoves = [];
      return;
    }

    // Get the actual piece from the board to ensure we have the latest position
    const boardPiece = this.state.chessEngine.getPieceAt(piece.position);
    if (!boardPiece || boardPiece.color !== this.state.currentTurn) {
      return; // Can't select opponent's piece or empty square
    }

    this.state.selectedPiece = boardPiece;
    const context = this.getSpecialMoveContext();
    this.state.validMoves = this.state.chessEngine.getValidMoves(boardPiece, context);
  }

  makeMove(to: Position): boolean {
    if (!this.state.selectedPiece) return false;

    const from = this.state.selectedPiece.position;
    let targetPiece = this.state.chessEngine.getPieceAt(to);
    
    // Check if target piece is protected
    if (targetPiece) {
      const targetKey = `${to.row},${to.col}`;
      if (this.state.protectedPieces.has(targetKey)) {
        // Can't capture protected piece
        return false;
      }
    }
    
    // Check if this is a special move (castling or en passant)
    const context = this.getSpecialMoveContext();
    let specialMove: Move['specialMove'] = undefined;
    let specialMoveData: Move['specialMoveData'] = undefined;
    
    // Check for castling
    if (this.state.selectedPiece.type === 'king') {
      const row = from.row;
      const kingCol = from.col;
      
      // Kingside castling
      if (to.row === row && to.col === kingCol + 2) {
        specialMove = 'castling_kingside';
        specialMoveData = {
          castling: {
            rookFrom: { row, col: 7 },
            rookTo: { row, col: kingCol + 1 }
          }
        };
      }
      // Queenside castling
      else if (to.row === row && to.col === kingCol - 2) {
        specialMove = 'castling_queenside';
        specialMoveData = {
          castling: {
            rookFrom: { row, col: 0 },
            rookTo: { row, col: kingCol - 1 }
          }
        };
      }
    }
    
    // Check for en passant
    if (this.state.selectedPiece.type === 'pawn' && this.state.enPassantTarget) {
      if (to.row === this.state.enPassantTarget.row && to.col === this.state.enPassantTarget.col) {
        specialMove = 'en_passant';
        const direction = this.state.selectedPiece.color === 'white' ? -1 : 1;
        const capturedPawnPosition = { 
          row: this.state.enPassantTarget.row - direction, 
          col: this.state.enPassantTarget.col 
        };
        specialMoveData = {
          enPassant: {
            capturedPawnPosition
          }
        };
        // Update captured piece for en passant
        const capturedPawn = this.state.chessEngine.getPieceAt(capturedPawnPosition);
        if (capturedPawn) {
          targetPiece = capturedPawn;
        }
      }
    }
    
    const move: Move = {
      from,
      to,
      piece: { ...this.state.selectedPiece },
      capturedPiece: targetPiece ? { ...targetPiece } : undefined,
      specialMove,
      specialMoveData
    };

    const success = this.state.chessEngine.makeMove(move, context);
    
    if (success) {
      // Update castling rights if king or rook moved
      this.updateCastlingRights(move);
      
      // Set en passant target if pawn moved two squares
      this.updateEnPassantTarget(move);
      
      this.state.moveHistory.push(move);
      this.state.canUndo = true;
      
      // Draw a card if a piece was captured
      if (targetPiece || move.specialMove === 'en_passant') {
        if (this.state.currentTurn === 'white') {
          this.state.cardSystem.drawCardForPlayer();
        } else {
          this.state.cardSystem.drawCardForAI();
        }
      }
      
      // Handle card effects
      if (this.state.isCardActive && this.state.activeCard?.effect.type === 'move_twice') {
        this.state.remainingMoves--;
        if (this.state.remainingMoves > 0) {
          // Keep the same piece selected for second move (get fresh from board)
          const movedPiece = this.state.chessEngine.getPieceAt(to);
          if (movedPiece && movedPiece.color === this.state.currentTurn) {
            this.state.selectedPiece = movedPiece;
            const context = this.getSpecialMoveContext();
            this.state.validMoves = this.state.chessEngine.getValidMoves(movedPiece, context);
          } else {
            // Piece was captured or something went wrong, end turn
            this.state.isCardActive = false;
            this.state.activeCard = null;
            this.state.remainingMoves = 1;
            this.endTurn();
          }
          return true; // Don't end turn yet
        } else {
          // Card effect complete
          this.state.isCardActive = false;
          this.state.activeCard = null;
          this.state.remainingMoves = 1;
        }
      }

      // End turn
      this.endTurn();
      return true;
    }

    return false;
  }

  playCard(cardId: string): boolean {
    if (this.state.currentTurn !== 'white') return false; // Only player can play cards for now
    
    // Get the card first to check its type
    const card = this.state.cardSystem.getCardById(cardId);
    if (!card) return false;
    
    // Check if we can play this card (can't play active cards while another is active)
    if (this.state.isCardActive) {
      return false;
    }
    
    // Now actually play the card (remove from hand)
    const playedCard = this.state.cardSystem.playCard(cardId, true);
    if (!playedCard) return false;

    switch (playedCard.effect.type) {
      case 'move_twice':
        this.state.isCardActive = true;
        this.state.activeCard = playedCard;
        this.state.remainingMoves = 2;
        break;
      
      case 'teleport':
        this.state.pendingTeleport = true;
        this.state.isCardActive = true;
        this.state.activeCard = playedCard;
        // Player needs to select a piece and then a destination
        break;
      
      case 'swap_pieces':
        this.state.pendingSwap = true;
        this.state.isCardActive = true;
        this.state.activeCard = playedCard;
        // Player needs to select two pieces to swap
        break;
      
      case 'protect_piece':
        this.state.isCardActive = true;
        this.state.activeCard = playedCard;
        // Player needs to select a piece to protect
        break;
      
      case 'extra_turn':
        this.state.hasExtraTurn = true;
        // Effect will be applied at end of turn
        break;
    }

    return true;
  }

  private updateCastlingRights(move: Move): void {
    const color = move.piece.color;
    
    // If king moved, lose all castling rights
    if (move.piece.type === 'king') {
      this.state.castlingRights[color].kingside = false;
      this.state.castlingRights[color].queenside = false;
    }
    
    // If rook moved, lose castling rights for that side
    if (move.piece.type === 'rook') {
      const row = move.from.row;
      if (row === (color === 'white' ? 7 : 0)) {
        if (move.from.col === 0) {
          // Queenside rook
          this.state.castlingRights[color].queenside = false;
        } else if (move.from.col === 7) {
          // Kingside rook
          this.state.castlingRights[color].kingside = false;
        }
      }
    }
    
    // If a rook was captured, the opponent loses castling rights for that side
    if (move.capturedPiece?.type === 'rook') {
      const capturedColor = move.capturedPiece.color;
      const row = move.to.row;
      if (row === (capturedColor === 'white' ? 7 : 0)) {
        if (move.to.col === 0) {
          this.state.castlingRights[capturedColor].queenside = false;
        } else if (move.to.col === 7) {
          this.state.castlingRights[capturedColor].kingside = false;
        }
      }
    }
  }

  private updateEnPassantTarget(move: Move): void {
    // Clear any existing en passant target from the previous turn
    // (it's only valid for one turn after a pawn double-move)
    this.state.enPassantTarget = undefined;
    
    // If a pawn moved two squares, set new en passant target
    if (move.piece.type === 'pawn') {
      const fromRow = move.from.row;
      const toRow = move.to.row;
      const startRow = move.piece.color === 'white' ? 6 : 1;
      
      if (fromRow === startRow && Math.abs(toRow - fromRow) === 2) {
        // Pawn moved two squares - set en passant target to the square it passed over
        const direction = move.piece.color === 'white' ? -1 : 1;
        this.state.enPassantTarget = {
          row: fromRow + direction,
          col: move.to.col
        };
      }
    }
  }

  private endTurn(): void {
    this.state.selectedPiece = null;
    this.state.validMoves = [];
    
    // Note: en passant target is now cleared at the start of the next move
    // (in updateEnPassantTarget), not here
    
    // Decrement protection timers
    const protectedKeys = Array.from(this.state.protectedPieces.keys());
    protectedKeys.forEach(key => {
      const remaining = this.state.protectedPieces.get(key)!;
      if (remaining <= 1) {
        this.state.protectedPieces.delete(key);
      } else {
        this.state.protectedPieces.set(key, remaining - 1);
      }
    });
    
    // Handle extra turn
    if (this.state.hasExtraTurn && this.state.currentTurn === 'white') {
      this.state.hasExtraTurn = false;
      // Don't change turn, player gets another turn
      return;
    }
    
    // Change turn
    this.state.currentTurn = this.state.currentTurn === 'white' ? 'black' : 'white';
    
    // Note: Cards are now only drawn when pieces are captured, not at end of turn
  }

  undoMove(): boolean {
    if (this.state.moveHistory.length === 0 || !this.state.canUndo) return false;

    const lastMove = this.state.moveHistory[this.state.moveHistory.length - 1];
    const board = this.state.chessEngine.getBoard();
    
    // Restore piece to original position
    const movedPiece = board[lastMove.to.row][lastMove.to.col];
    if (movedPiece) {
      // Restore the piece to its original position with original state
      const restoredPiece = {
        ...lastMove.piece,
        position: lastMove.from,
        hasMoved: lastMove.piece.hasMoved
      };
      board[lastMove.from.row][lastMove.from.col] = restoredPiece;
      board[lastMove.to.row][lastMove.to.col] = lastMove.capturedPiece || null;
    }

    this.state.moveHistory.pop();
    this.state.canUndo = this.state.moveHistory.length > 0;
    this.state.currentTurn = this.state.currentTurn === 'white' ? 'black' : 'white';
    this.state.selectedPiece = null;
    this.state.validMoves = [];
    this.state.isCardActive = false;
    this.state.activeCard = null;
    this.state.remainingMoves = 1;

    return true;
  }

  getPlayerHand(): Card[] {
    return this.state.cardSystem.getPlayerHand();
  }

  resetGame(): void {
    this.state = {
      chessEngine: new ChessEngine(),
      cardSystem: new CardSystem(),
      currentTurn: 'white',
      selectedPiece: null,
      validMoves: [],
      moveHistory: [],
      canUndo: false,
      isCardActive: false,
      activeCard: null,
      remainingMoves: 1,
      protectedPieces: new Map(),
      hasExtraTurn: false,
      pendingTeleport: false,
      pendingSwap: false,
      enPassantTarget: undefined,
      castlingRights: {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
      }
    };
  }
}

