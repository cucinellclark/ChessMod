import { useState, useCallback, useRef } from 'react';
import { Board } from './components/Board';
import { CardHand } from './components/CardHand';
import { MoveHistory } from './components/MoveHistory';
import { Timer } from './components/Timer';
import { GameOver } from './components/GameOver';
import { GameStateManager } from './utils/gameState';
import { AI } from './utils/ai';
import { Piece, Position, Color } from './types/chess';
import './App.css';

function App() {
  const [gameStateManager] = useState(() => new GameStateManager());
  const [gameState, setGameState] = useState(gameStateManager.getState());
  const [ai] = useState(() => new AI('black'));
  const [isAITurn, setIsAITurn] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [gameId, setGameId] = useState(0); // Used to reset Timer component
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get board representation from chess engine
  const getBoard = useCallback((): (Piece | null)[][] => {
    return gameStateManager.getState().chessEngine.getBoard();
  }, [gameStateManager]);

  const updateGameState = useCallback(() => {
    setGameState(gameStateManager.getState());
  }, [gameStateManager]);

  const makeAIMove = useCallback(() => {
    if (!useAI) return;
    
    const currentState = gameStateManager.getState();
    if (currentState.currentTurn !== 'black') return;
    
    // Don't make AI move if game is over (checkmate)
    if (currentState.isCheckmate.white || currentState.isCheckmate.black) return;
    
    setIsAITurn(true);
    
    aiTimeoutRef.current = setTimeout(() => {
      const state = gameStateManager.getState();
      if (state.currentTurn !== 'black' || !useAI) {
        setIsAITurn(false);
        return;
      }
      
      // Don't make AI move if game is over (checkmate)
      if (state.isCheckmate.white || state.isCheckmate.black) {
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
  }, [gameStateManager, ai, updateGameState, useAI]);

  const handleSquareClick = useCallback((position: Position) => {
    if (isAITurn) return;
    
    // Don't allow moves if game is over (checkmate)
    if (gameState.isCheckmate.white || gameState.isCheckmate.black) return;
    
    // When AI is enabled, only white can move manually
    // When AI is disabled, both players can move
    if (useAI && gameState.currentTurn !== 'white') return;
    
    const board = gameStateManager.getState().chessEngine.getBoard();
    const piece = board[position.row][position.col];

    if (gameState.selectedPiece) {
      // Try to move the selected piece
      const success = gameStateManager.makeMove(position);
      if (success) {
        updateGameState();
        const newState = gameStateManager.getState();
        // If card is still active, don't trigger AI yet
        if (!newState.isCardActive && useAI) {
          // Card effect complete or normal move, AI's turn
          setTimeout(() => makeAIMove(), 500);
        }
      } else {
        // If move failed, try selecting a new piece
        const currentTurn = gameState.currentTurn;
        if (piece && piece.color === currentTurn) {
          gameStateManager.selectPiece(piece);
          updateGameState();
        } else {
          gameStateManager.selectPiece(null);
          updateGameState();
        }
      }
    } else {
      // Select a piece of the current turn's color
      const currentTurn = gameState.currentTurn;
      if (piece && piece.color === currentTurn) {
        gameStateManager.selectPiece(piece);
        updateGameState();
      }
    }
  }, [gameState, gameStateManager, updateGameState, isAITurn, makeAIMove, useAI]);

  const handleCardPlay = useCallback((cardId: string) => {
    if (isAITurn) return;
    // Cards can only be played by white for now (even when AI is off)
    if (gameState.currentTurn !== 'white') return;
    
    // Don't allow cards if game is over (checkmate)
    if (gameState.isCheckmate.white || gameState.isCheckmate.black) return;
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
      // Cancel any pending AI move
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    }
  }, [gameStateManager, updateGameState]);

  const handleNewGame = useCallback(() => {
    // Cancel any pending AI move
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setIsAITurn(false);
    gameStateManager.resetGame();
    updateGameState();
    // Increment gameId to reset Timer component
    setGameId(prev => prev + 1);
  }, [gameStateManager, updateGameState]);

  const handleToggleAI = useCallback((enabled: boolean) => {
    setUseAI(enabled);
    // Cancel any pending AI move when disabling AI
    if (!enabled && aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
      setIsAITurn(false);
    }
  }, []);

  const board = getBoard();

  const getTurnText = () => {
    if (useAI) {
      return gameState.currentTurn === 'white' ? 'Your Turn' : "AI's Turn";
    } else {
      return gameState.currentTurn === 'white' ? "White's Turn" : "Black's Turn";
    }
  };

  // Determine winner based on checkmate status
  const getWinner = (): Color | null => {
    // Debug logging
    if (gameState.isCheckmate.white || gameState.isCheckmate.black) {
      console.log('Checkmate state in App:', gameState.isCheckmate);
    }
    
    if (gameState.isCheckmate.white) {
      return 'black'; // Black wins if white is checkmated
    }
    if (gameState.isCheckmate.black) {
      return 'white'; // White wins if black is checkmated
    }
    return null;
  };

  const winner = getWinner();
  
  // Debug logging
  if (winner) {
    console.log('Winner determined:', winner);
  }

  return (
    <div className="app">
      {winner && (
        <GameOver 
          winner={winner} 
          onNewGame={handleNewGame}
        />
      )}
      <header className="app-header">
        <h1>ChessMod</h1>
        <p className="subtitle">Chess with Cards</p>
        <div className="game-controls">
          <button className="new-game-button" onClick={handleNewGame}>
            New Game
          </button>
          <label className="ai-toggle">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => handleToggleAI(e.target.checked)}
            />
            <span>Use AI</span>
          </label>
        </div>
      </header>
      
      <div className="game-container">
        <div className="game-sidebar left">
          <Timer 
            key={gameId}
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
            {getTurnText()}
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

