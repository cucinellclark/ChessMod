import { Color, Move, Piece, Position } from '../types/chess';
import { Card } from '../types/cards';
import { ChessEngine } from './chessEngine';
import { CardSystem } from './cardSystem';

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
      pendingSwap: false
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
    this.state.validMoves = this.state.chessEngine.getValidMoves(boardPiece);
  }

  makeMove(to: Position): boolean {
    if (!this.state.selectedPiece) return false;

    const from = this.state.selectedPiece.position;
    const targetPiece = this.state.chessEngine.getPieceAt(to);
    
    // Check if target piece is protected
    if (targetPiece) {
      const targetKey = `${to.row},${to.col}`;
      if (this.state.protectedPieces.has(targetKey)) {
        // Can't capture protected piece
        return false;
      }
    }
    
    const move: Move = {
      from,
      to,
      piece: { ...this.state.selectedPiece },
      capturedPiece: targetPiece ? { ...targetPiece } : undefined
    };

    const success = this.state.chessEngine.makeMove(move);
    
    if (success) {
      this.state.moveHistory.push(move);
      this.state.canUndo = true;
      
      // Draw a card if a piece was captured
      if (targetPiece) {
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
            this.state.validMoves = this.state.chessEngine.getValidMoves(movedPiece);
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

  private endTurn(): void {
    this.state.selectedPiece = null;
    this.state.validMoves = [];
    
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
      pendingSwap: false
    };
  }
}

