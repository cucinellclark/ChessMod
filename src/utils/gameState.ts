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
      remainingMoves: 1
    };
  }

  getState(): GameState {
    return { ...this.state };
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
    if (this.state.isCardActive) return false; // Can't play another card while one is active

    const card = this.state.cardSystem.playCard(cardId, true);
    if (!card) return false;

    if (card.effect.type === 'move_twice') {
      this.state.isCardActive = true;
      this.state.activeCard = card;
      this.state.remainingMoves = 2;
    }

    return true;
  }

  private endTurn(): void {
    this.state.selectedPiece = null;
    this.state.validMoves = [];
    this.state.currentTurn = this.state.currentTurn === 'white' ? 'black' : 'white';
    
    // Draw a card for the player whose turn just ended
    if (this.state.currentTurn === 'white') {
      this.state.cardSystem.drawCardForPlayer();
    } else {
      this.state.cardSystem.drawCardForAI();
    }
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
}

