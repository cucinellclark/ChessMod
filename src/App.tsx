import { useState, useCallback } from 'react';
import { Board } from './components/Board';
import { CardHand } from './components/CardHand';
import { MoveHistory } from './components/MoveHistory';
import { Timer } from './components/Timer';
import { GameStateManager } from './utils/gameState';
import { AI } from './utils/ai';
import { Piece, Position } from './types/chess';
import './App.css';

function App() {
  const [gameStateManager] = useState(() => new GameStateManager());
  const [gameState, setGameState] = useState(gameStateManager.getState());
  const [ai] = useState(() => new AI('black'));
  const [isAITurn, setIsAITurn] = useState(false);

  // Get board representation from chess engine
  const getBoard = useCallback((): (Piece | null)[][] => {
    return gameStateManager.getState().chessEngine.getBoard();
  }, [gameStateManager]);

  const updateGameState = useCallback(() => {
    setGameState(gameStateManager.getState());
  }, [gameStateManager]);

  const makeAIMove = useCallback(() => {
    const currentState = gameStateManager.getState();
    if (currentState.currentTurn !== 'black') return;
    
    setIsAITurn(true);
    
    setTimeout(() => {
      const state = gameStateManager.getState();
      if (state.currentTurn !== 'black') {
        setIsAITurn(false);
        return;
      }
      
      const bestMove = ai.getBestMove(state.chessEngine);
      
      if (bestMove) {
        // Select the piece
        gameStateManager.selectPiece(bestMove.piece);
        // Make the move
        gameStateManager.makeMove(bestMove.to);
        updateGameState();
      }
      
      setIsAITurn(false);
    }, 1000); // Delay for better UX
  }, [gameStateManager, ai, updateGameState]);

  const handleSquareClick = useCallback((position: Position) => {
    if (gameState.currentTurn !== 'white' || isAITurn) return;
    
    const board = gameStateManager.getState().chessEngine.getBoard();
    const piece = board[position.row][position.col];

    if (gameState.selectedPiece) {
      // Try to move the selected piece
      const success = gameStateManager.makeMove(position);
      if (success) {
        updateGameState();
        const newState = gameStateManager.getState();
        // If card is still active, don't trigger AI yet
        if (!newState.isCardActive) {
          // Card effect complete or normal move, AI's turn
          setTimeout(() => makeAIMove(), 500);
        }
      } else {
        // If move failed, try selecting a new piece
        if (piece && piece.color === 'white') {
          gameStateManager.selectPiece(piece);
          updateGameState();
        } else {
          gameStateManager.selectPiece(null);
          updateGameState();
        }
      }
    } else {
      // Select a piece
      if (piece && piece.color === 'white') {
        gameStateManager.selectPiece(piece);
        updateGameState();
      }
    }
  }, [gameState, gameStateManager, updateGameState, isAITurn, makeAIMove]);

  const handleCardPlay = useCallback((cardId: string) => {
    if (gameState.currentTurn !== 'white' || isAITurn) return;
    const success = gameStateManager.playCard(cardId);
    if (success) {
      updateGameState();
    }
  }, [gameState, gameStateManager, updateGameState, isAITurn]);

  const handleUndo = useCallback(() => {
    const success = gameStateManager.undoMove();
    if (success) {
      updateGameState();
      setIsAITurn(false);
    }
  }, [gameStateManager, updateGameState]);

  const board = getBoard();

  return (
    <div className="app">
      <header className="app-header">
        <h1>ChessMod</h1>
        <p className="subtitle">Chess with Cards</p>
      </header>
      
      <div className="game-container">
        <div className="game-sidebar left">
          <Timer 
            currentTurn={gameState.currentTurn} 
            isActive={true}
          />
          <MoveHistory 
            moves={gameState.moveHistory}
            onUndo={handleUndo}
            canUndo={gameState.canUndo}
          />
        </div>

        <div className="game-board-area">
          <div className="turn-indicator">
            {gameState.currentTurn === 'white' ? 'Your Turn' : "AI's Turn"}
            {gameState.isCardActive && (
              <span className="card-active-indicator">
                (Card Active: {gameState.remainingMoves} moves remaining)
              </span>
            )}
          </div>
          <Board
            board={board}
            selectedPiece={gameState.selectedPiece}
            validMoves={gameState.validMoves}
            onSquareClick={handleSquareClick}
          />
        </div>

        <div className="game-sidebar right">
          <CardHand
            cards={gameStateManager.getPlayerHand()}
            onCardPlay={handleCardPlay}
            disabled={gameState.currentTurn !== 'white' || isAITurn}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

