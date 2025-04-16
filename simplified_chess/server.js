import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { moveString, moveNumber } from './modules/constants.js';
import randStr from './modules/randomString.js';
import Timer, { msToSec } from './modules/timer.js';
import { loadEngine } from './loadEngine.js';

const __dirname = path.resolve();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use((req, res, next) => {
    if (
        req.headers.accept?.includes('text/html') ||
        req.url.includes('worker') ||
        req.url.includes('stockfish.js')
    ) {
        res.header('Cross-Origin-Opener-Policy', 'same-origin');
        res.header('Cross-Origin-Embedder-Policy', 'require-corp');
        res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    }
    next();
});

app.use(express.static('.'));
app.use(express.json());

let serverDelay = 2;
let oldServerDelay = 2;

let oldConnections = 0;

let playing = 0;
let oldPlaying = 0;
setInterval(() => {
    if (serverDelay !== oldServerDelay) {
        oldServerDelay = serverDelay;
        io.sockets.emit('server-delay', serverDelay ?? 2);
    }
    if (io.engine.clientsCount !== oldConnections) {
        oldConnections = io.engine.clientsCount;
        io.sockets.emit('connections', oldConnections);
    }
    if (playing !== oldPlaying) {
        oldPlaying = playing;
        io.sockets.emit('playing', playing);
    }
}, 5000);

const games = {};

function oppositeColor(color) {
    return color === 'white' ? 'black' : 'white';
}

io.on('connection', (socket) => {
    console.log(`> socket connected ${socket.id}`);

    socket.emit('connections', io.engine.clientsCount);
    socket.emit('playing', playing);
    socket.emit('server-delay', serverDelay ?? 2);

    socket.on('join-room', ({ roomId, color }) => {
        if (games[roomId]) {
            socket.emit('join-room', 'success');
            games[roomId].join(socket, null, color);

            socket.on('disconnect', () => {
                if (games[roomId]) games[roomId].leave(socket);
            });
        } else {
            socket.emit('not-found');
        }
    });

    socket.on('get-rooms', () => {
        const rooms = [];
        for (const roomId in games) {
            if (!games[roomId].isPublic) continue;
            rooms.push({
                roomId,
                player: games[roomId].getOwnerInfo(),
                time: games[roomId].getTime(),
            });
        }
        socket.emit('get-rooms', rooms);
    });

    socket.on('disconnect', () => {
        console.log(`> socket disconnected ${socket.id}`);
    });

    socket.on('create-room', ({ time, isPublic }) => {
        if (isNaN(time)) {
            socket.emit('create-room', 'error:Time must be a number');
            return;
        }
        time = +time;
        if (time < 10) {
            socket.emit('create-room', 'error:Time must be greater than 10 seconds');
            return;
        }
        if (time > 10800) {
            socket.emit('create-room', 'error:Time limit is 180 minutes');
            return;
        }

        let newId = randStr(10);
        while (games[newId]) {
            newId = randStr(10);
        }
        const roomId = newId;
        games[roomId] = Game(roomId, +time, false, !!isPublic);
        console.log(`> Room created ${roomId}`);
        socket.emit('create-room', roomId);
    });
});

class Move {
    from = {
        x: null,
        y: null,
    };
    to = {
        x: null,
        y: null,
    };
    promotion;
    constructor(fromX, fromY, toX, toY, promotion = null) {
        this.from.x = fromX;
        this.from.y = fromY;
        this.to.x = toX;
        this.to.y = toY;
        this.promotion = promotion;
    }
}

function secToMs(sec) {
    return sec * 1000;
}

function Game(id, time, rated = false, isPublic = false) {
    let serverDelayStart = 0;

    let state = 0;

    const roomOwner = {
        username: null,
        elo: null,
    };

    function getOwnerInfo() {
        return roomOwner;
    }

    const gameTime = time;

    function getTime() {
        return gameTime;
    }

    let fen = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`;

    const players = {
        white: {
            id: null,
            socket: null,
            timer: new Timer(secToMs(gameTime)),
            token: null,
            info: null,
        },
        black: {
            id: null,
            socket: null,
            timer: new Timer(secToMs(gameTime)),
            token: null,
            info: null,
        },
    };

    setInterval(() => {
        if (state !== 1) return;
        if (msToSec(players.white.timer.getTime()) <= 0) {
            win('black');
            io.to(id).emit('time-out', 'white');
            io.to(id).emit('update-timers', {
                white: 0,
                black: players.black.timer.getTime(),
                running: null,
            });
        } else if (msToSec(players.black.timer.getTime()) <= 0) {
            win('white');
            io.to(id).emit('time-out', 'black');
            io.to(id).emit('update-timers', {
                white: players.white.timer.getTime(),
                black: 0,
                running: null,
            });
        }
    }, 100);

    let turn = 'w';
    const moves = [];

    const engine = loadEngine();

    engine.onmessage = (data) => {
        data = data + '';
        if (data.startsWith('Fen:')) {
            fen = data.split(':')[1].trim();
            const curTurn = data.split(' ')[2];
            if (curTurn === turn) {
                validMove();
            } else {
                invalidMove();
            }
        }
        if (data == 'info depth 0 score mate 0') {
            win(turn === 'b' ? 'white' : 'black');
        }
    };

    engine.postMessage('uci');
    engine.postMessage('isready');

    engine.postMessage('ucinewgame');
    engine.postMessage('position startpos');

    function win(color) {
        console.log(`> Room ${id}: ${color} is victorious`);
        state = 2;
    }

    function notYourTurn(color) {
        if (players[color].socket) players[color].socket?.emit('not-your-turn');
    }

    function invalidMove() {
        players[turn === 'w' ? 'black' : 'white'].socket?.emit('invalid-move');
        turn = turn === 'w' ? 'b' : 'w';
        moves.splice(moves.length - 1, 1);
    }

    function validMove() {
        const lastMove = moves[moves.length - 1];
        const lastMoveArr = lastMove.split('');
        const from = {
            x: +moveNumber[`x${lastMoveArr[0]}`],
            y: +moveNumber[`y${lastMoveArr[1]}`],
        };
        const to = {
            x: +moveNumber[`x${lastMoveArr[2]}`],
            y: +moveNumber[`y${lastMoveArr[3]}`],
        };
        const promotion = lastMoveArr[4] ?? null;
        const move = new Move(from.x, from.y, to.x, to.y, promotion);
        io.to(id).emit('move', move);
        io.to(id).emit('fen', fen);
        if (state === 0) {
            state = 1;
            players.white.timer.start();
            io.to(id).emit('update-timers', {
                white: players.white.timer.getTime(),
                black: players.black.timer.getTime(),
                running: 'white',
            });
        } else if (state === 1) {
            if (turn === 'w') {
                players.white.timer.pause();
                players.black.timer.start();
                io.to(id).emit('update-timers', {
                    white: players.white.timer.getTime(),
                    black: players.black.timer.getTime(),
                    running: 'black',
                });
            } else {
                players.black.timer.pause();
                players.white.timer.start();
                io.to(id).emit('update-timers', {
                    white: players.white.timer.getTime(),
                    black: players.black.timer.getTime(),
                    running: 'white',
                });
            }
        }
    }

    function join(socket, token, color) {
        if (color === 'white' || color === 'black') {
            if (players[color].id) {
                socket.emit('room-full');
                return;
            }
            players[color].id = socket.id;
            players[color].socket = socket;
            players[color].token = token;
            socket.join(id);
            socket.emit('joined', color);
            io.to(id).emit('player-joined', color);
            playing++;
            console.log(`> Room ${id}: ${color} joined`);
        } else {
            if (players.white.id && players.black.id) {
                socket.emit('room-full');
                return;
            }
            if (!players.white.id) {
                players.white.id = socket.id;
                players.white.socket = socket;
                players.white.token = token;
                socket.join(id);
                socket.emit('joined', 'white');
                io.to(id).emit('player-joined', 'white');
                playing++;
                console.log(`> Room ${id}: white joined`);
            } else if (!players.black.id) {
                players.black.id = socket.id;
                players.black.socket = socket;
                players.black.token = token;
                socket.join(id);
                socket.emit('joined', 'black');
                io.to(id).emit('player-joined', 'black');
                playing++;
                console.log(`> Room ${id}: black joined`);
            }
        }

        socket.on('move', (move) => {
            if (state === 2) return;
            const color = players.white.id === socket.id ? 'white' : 'black';
            if (turn === 'w' && color === 'black') {
                notYourTurn(color);
                return;
            }
            if (turn === 'b' && color === 'white') {
                notYourTurn(color);
                return;
            }
            const moveStr = `${moveString[`x${move.from.x}`]}${moveString[`y${move.from.y}`]}${
                moveString[`x${move.to.x}`]
            }${moveString[`y${move.to.y}`]}${move.promotion ?? ''}`;
            moves.push(moveStr);
            engine.postMessage(`position startpos moves ${moves.join(' ')}`);
            engine.postMessage('d');
            turn = turn === 'w' ? 'b' : 'w';
        });

        socket.on('resign', () => {
            if (state === 2) return;
            const color = players.white.id === socket.id ? 'white' : 'black';
            win(oppositeColor(color));
            io.to(id).emit('resign', color);
        });

        socket.on('draw-offer', () => {
            if (state === 2) return;
            const color = players.white.id === socket.id ? 'white' : 'black';
            const opponent = oppositeColor(color);
            if (players[opponent].socket) {
                players[opponent].socket.emit('draw-offer', color);
            }
        });

        socket.on('draw-accept', () => {
            if (state === 2) return;
            state = 2;
            io.to(id).emit('draw-accept');
        });

        socket.on('draw-decline', () => {
            if (state === 2) return;
            const color = players.white.id === socket.id ? 'white' : 'black';
            const opponent = oppositeColor(color);
            if (players[opponent].socket) {
                players[opponent].socket.emit('draw-decline');
            }
        });
    }

    function leave(socket) {
        if (players.white.id === socket.id) {
            console.log(`> Room ${id}: white left`);
            players.white.id = null;
            players.white.socket = null;
            players.white.token = null;
            io.to(id).emit('player-left', 'white');
            playing--;
        } else if (players.black.id === socket.id) {
            console.log(`> Room ${id}: black left`);
            players.black.id = null;
            players.black.socket = null;
            players.black.token = null;
            io.to(id).emit('player-left', 'black');
            playing--;
        }
        if (!players.white.id && !players.black.id) {
            console.log(`> Room ${id}: deleted`);
            delete games[id];
        }
    }

    return {
        join,
        leave,
        getOwnerInfo,
        getTime,
        isPublic,
    };
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
