import { loadEngine } from './loadEngine.js';
import { moveString, moveNumber } from './modules/constants.js';

// Game state
let gameMode = null;
let playerColor = 'white';
let skillLevel = 10;
let moveTime = 200;
let gameBoard = null;
let engine = null;
let currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
let moves = [];
let turn = 'w';
let isGameOver = false;
let capturedPieces = { white: [], black: [] };

// DOM elements
const gameModeButtons = document.querySelectorAll('.gamemode button');
const gameContainer = document.getElementById('game-container');
const gameStatus = document.querySelector('.game-status');
const undoButton = document.querySelector('.undo-btn');
const resetButton = document.querySelector('.reset-btn');
const whiteCapturedPieces = document.querySelector('.captured-pieces.white');
const blackCapturedPieces = document.querySelector('.captured-pieces.black');

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to game mode buttons
    gameModeButtons.forEach(button => {
        button.addEventListener('click', () => {
            gameMode = button.dataset.mode;
            if (gameMode === 'playerVsComputer') {
                showStockfishSettings();
            } else if (gameMode === 'playerVsPlayer') {
                startGame();
            } else if (gameMode === 'computerVsComputer') {
                showStockfishSettings();
            }
        });
    });

    // Add event listeners to game controls
    undoButton.addEventListener('click', undoMove);
    resetButton.addEventListener('click', resetGame);
});

// Show Stockfish settings dialog
function showStockfishSettings() {
    const template = document.getElementById('skill-level-template');
    const clone = template.content.cloneNode(true);
    document.body.appendChild(clone);

    const levelSelector = document.querySelector('.level-selector');
    const skillInput = levelSelector.querySelector('.skill input');
    const skillText = levelSelector.querySelector('.skill span');
    const moveTimeInput = levelSelector.querySelector('.move-time input');
    const moveTimeText = levelSelector.querySelector('.move-time span');
    const closeBtn = levelSelector.querySelector('.close-btn');
    const startBtn = levelSelector.querySelector('.start-btn');
    const colorButtons = levelSelector.querySelectorAll('.color-btn');

    // Update skill level text
    skillInput.addEventListener('input', () => {
        skillLevel = skillInput.value;
        skillText.textContent = `Skill level: ${skillLevel}`;
    });

    // Update move time text
    moveTimeInput.addEventListener('input', () => {
        moveTime = moveTimeInput.value;
        moveTimeText.textContent = `Thinking time: ${moveTime} ms`;
    });

    // Set player color
    colorButtons.forEach(button => {
        button.addEventListener('click', () => {
            colorButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            
            if (button.classList.contains('white')) {
                playerColor = 'white';
            } else if (button.classList.contains('black')) {
                playerColor = 'black';
            } else {
                playerColor = Math.random() < 0.5 ? 'white' : 'black';
            }
        });
    });

    // Close button
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(levelSelector);
    });

    // Start button
    startBtn.addEventListener('click', () => {
        document.body.removeChild(levelSelector);
        startGame();
    });
}

// Start the game
async function startGame() {
    // Show game container
    gameContainer.classList.remove('hidden');
    document.querySelector('.play').classList.add('hidden');
    
    // Initialize the board
    initializeBoard();
    
    // Initialize Stockfish engine
    if (gameMode === 'playerVsComputer' || gameMode === 'computerVsComputer') {
        engine = await loadEngine();
        setupEngine();
        
        // If computer plays as white, make the first move
        if ((gameMode === 'playerVsComputer' && playerColor === 'black') || 
            gameMode === 'computerVsComputer') {
            makeComputerMove();
        }
    }
}

// Initialize the chess board
function initializeBoard() {
    // Create the chess board
    gameBoard = document.createElement('div');
    gameBoard.className = 'chess-board';
    
    // Create the squares
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.dataset.row = row;
            square.dataset.col = col;
            
            // Set square color
            if ((row + col) % 2 === 0) {
                square.classList.add('light');
            } else {
                square.classList.add('dark');
            }
            
            // Add event listener for moves
            square.addEventListener('click', handleSquareClick);
            
            gameBoard.appendChild(square);
        }
    }
    
    // Add the board to the game container
    const gameBoardContainer = document.querySelector('.game-board');
    gameBoardContainer.innerHTML = '';
    gameBoardContainer.appendChild(gameBoard);
    
    // Set up the initial position
    updateBoard(currentFen);
}

// Set up the Stockfish engine
function setupEngine() {
    engine.onmessage = function(event) {
        const message = event.data;
        
        if (message.startsWith('bestmove')) {
            const bestMove = message.split(' ')[1];
            if (bestMove && bestMove !== '(none)') {
                const from = {
                    x: moveNumber[`x${bestMove[0]}`],
                    y: moveNumber[`y${bestMove[1]}`]
                };
                const to = {
                    x: moveNumber[`x${bestMove[2]}`],
                    y: moveNumber[`y${bestMove[3]}`]
                };
                const promotion = bestMove.length > 4 ? bestMove[4] : null;
                
                makeMove(from, to, promotion);
                
                // If computer vs computer, make the next move
                if (gameMode === 'computerVsComputer' && !isGameOver) {
                    setTimeout(makeComputerMove, 500);
                }
            }
        } else if (message.startsWith('Fen:')) {
            currentFen = message.split(':')[1].trim();
            const fenParts = currentFen.split(' ');
            turn = fenParts[1];
            updateBoard(currentFen);
            updateGameStatus();
        } else if (message.includes('mate 0')) {
            isGameOver = true;
            gameStatus.textContent = turn === 'w' ? 'Black wins by checkmate!' : 'White wins by checkmate!';
        }
    };
    
    engine.postMessage('uci');
    engine.postMessage('isready');
    engine.postMessage('ucinewgame');
    engine.postMessage(`setoption name Skill Level value ${skillLevel}`);
    engine.postMessage(`setoption name Move Overhead value ${moveTime}`);
}

// Make a computer move
function makeComputerMove() {
    if (engine && !isGameOver) {
        engine.postMessage(`position startpos moves ${moves.join(' ')}`);
        engine.postMessage(`go movetime ${moveTime}`);
    }
}

// Handle square click
let selectedSquare = null;

function handleSquareClick(event) {
    if (isGameOver) return;
    
    // If it's computer's turn in playerVsComputer mode, ignore clicks
    if (gameMode === 'playerVsComputer') {
        const isPlayerTurn = (playerColor === 'white' && turn === 'w') || 
                            (playerColor === 'black' && turn === 'b');
        if (!isPlayerTurn) return;
    }
    
    // If it's computerVsComputer mode, ignore clicks
    if (gameMode === 'computerVsComputer') return;
    
    const square = event.target;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    
    if (selectedSquare) {
        // If the same square is clicked again, deselect it
        if (selectedSquare === square) {
            selectedSquare.classList.remove('selected');
            selectedSquare = null;
            return;
        }
        
        // Make a move
        const fromRow = parseInt(selectedSquare.dataset.row);
        const fromCol = parseInt(selectedSquare.dataset.col);
        
        makeMove({ x: fromCol, y: fromRow }, { x: col, y: row });
        
        // Deselect the square
        selectedSquare.classList.remove('selected');
        selectedSquare = null;
        
        // If playing against computer, make computer move
        if (gameMode === 'playerVsComputer' && !isGameOver) {
            setTimeout(makeComputerMove, 500);
        }
    } else {
        // Check if the square has a piece of the current player
        const piece = square.querySelector('.piece');
        if (piece) {
            const pieceColor = piece.classList.contains('white') ? 'white' : 'black';
            const isCurrentPlayerPiece = (turn === 'w' && pieceColor === 'white') || 
                                        (turn === 'b' && pieceColor === 'black');
            
            if (isCurrentPlayerPiece) {
                selectedSquare = square;
                selectedSquare.classList.add('selected');
            }
        }
    }
}

// Make a move
function makeMove(from, to, promotion = null) {
    const fromSquare = document.querySelector(`.square[data-row="${from.y}"][data-col="${from.x}"]`);
    const toSquare = document.querySelector(`.square[data-row="${to.y}"][data-col="${to.x}"]`);
    
    // Check if the move captures a piece
    const capturedPiece = toSquare.querySelector('.piece');
    if (capturedPiece) {
        const capturedColor = capturedPiece.classList.contains('white') ? 'white' : 'black';
        const capturedType = Array.from(capturedPiece.classList)
            .find(cls => ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'].includes(cls));
        
        capturedPieces[capturedColor].push(capturedType);
        updateCapturedPieces();
    }
    
    // Create move string
    const moveStr = `${moveString[`x${from.x}`]}${moveString[`y${from.y}`]}${
        moveString[`x${to.x}`]}${moveString[`y${to.y}`]}${promotion || ''}`;
    
    moves.push(moveStr);
    
    // Update the engine with the move
    if (engine) {
        engine.postMessage(`position startpos moves ${moves.join(' ')}`);
        engine.postMessage('d');
    } else {
        // If no engine, manually update turn
        turn = turn === 'w' ? 'b' : 'w';
        updateGameStatus();
    }
}

// Update the board based on FEN
function updateBoard(fen) {
    const board = fen.split(' ')[0];
    const rows = board.split('/');
    
    // Clear the board
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const piece = square.querySelector('.piece');
        if (piece) {
            square.removeChild(piece);
        }
    });
    
    // Place the pieces
    for (let row = 0; row < 8; row++) {
        let col = 0;
        for (let i = 0; i < rows[row].length; i++) {
            const char = rows[row][i];
            
            if (isNaN(char)) {
                const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
                const piece = document.createElement('div');
                piece.className = 'piece';
                
                const isWhite = char === char.toUpperCase();
                piece.classList.add(isWhite ? 'white' : 'black');
                
                const pieceType = char.toLowerCase();
                switch (pieceType) {
                    case 'p': piece.classList.add('pawn'); break;
                    case 'n': piece.classList.add('knight'); break;
                    case 'b': piece.classList.add('bishop'); break;
                    case 'r': piece.classList.add('rook'); break;
                    case 'q': piece.classList.add('queen'); break;
                    case 'k': piece.classList.add('king'); break;
                }
                
                square.appendChild(piece);
                col++;
            } else {
                col += parseInt(char);
            }
        }
    }
}

// Update game status
function updateGameStatus() {
    gameStatus.textContent = turn === 'w' ? 'White to move' : 'Black to move';
}

// Update captured pieces display
function updateCapturedPieces() {
    whiteCapturedPieces.innerHTML = '';
    blackCapturedPieces.innerHTML = '';
    
    capturedPieces.black.forEach(pieceType => {
        const piece = document.createElement('div');
        piece.className = `piece-small black ${pieceType}`;
        whiteCapturedPieces.appendChild(piece);
    });
    
    capturedPieces.white.forEach(pieceType => {
        const piece = document.createElement('div');
        piece.className = `piece-small white ${pieceType}`;
        blackCapturedPieces.appendChild(piece);
    });
}

// Undo the last move
function undoMove() {
    if (moves.length === 0) return;
    
    // Remove the last move
    moves.pop();
    
    // Reset the board to the initial position
    currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    turn = 'w';
    
    // If there are moves, replay them
    if (moves.length > 0) {
        if (engine) {
            engine.postMessage(`position startpos moves ${moves.join(' ')}`);
            engine.postMessage('d');
        } else {
            // If no engine, manually update the board
            updateBoard(currentFen);
            // Update turn based on number of moves
            turn = moves.length % 2 === 0 ? 'w' : 'b';
            updateGameStatus();
        }
    } else {
        // If no moves, reset to initial position
        updateBoard(currentFen);
        updateGameStatus();
    }
    
    // Reset captured pieces if necessary
    capturedPieces = { white: [], black: [] };
    updateCapturedPieces();
    
    // Reset game over flag
    isGameOver = false;
}

// Reset the game
function resetGame() {
    // Reset moves
    moves = [];
    
    // Reset FEN and turn
    currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    turn = 'w';
    
    // Reset captured pieces
    capturedPieces = { white: [], black: [] };
    updateCapturedPieces();
    
    // Reset game over flag
    isGameOver = false;
    
    // Update the board
    updateBoard(currentFen);
    updateGameStatus();
    
    // If playing against computer as black, make computer move
    if (gameMode === 'playerVsComputer' && playerColor === 'black') {
        setTimeout(makeComputerMove, 500);
    } else if (gameMode === 'computerVsComputer') {
        setTimeout(makeComputerMove, 500);
    }
}
