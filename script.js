// Chess Unicode pieces
const PIECES = {
    wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
    bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const initialBoard = [
    ['bR','bN','bB','bQ','bK','bB','bN','bR'],
    ['bP','bP','bP','bP','bP','bP','bP','bP'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['wP','wP','wP','wP','wP','wP','wP','wP'],
    ['wR','wN','wB','wQ','wK','wB','wN','wR']
];

let board = [];
let selected = null;
let turn = 'w';
let legalMoves = [];

const boardDiv = document.getElementById('board');
const statusDiv = document.getElementById('status');
const resetBtn = document.getElementById('reset');

function cloneBoard(b) {
    return b.map(row => row.slice());
}

function renderBoard() {
    boardDiv.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sq = document.createElement('div');
            sq.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
            sq.dataset.row = r;
            sq.dataset.col = c;
            if (selected && selected[0] === r && selected[1] === c) sq.classList.add('selected');
            if (legalMoves.some(([mr, mc]) => mr === r && mc === c)) sq.classList.add('move');
            const piece = board[r][c];
            if (piece) sq.textContent = PIECES[piece];
            sq.addEventListener('click', () => onSquareClick(r, c));
            boardDiv.appendChild(sq);
        }
    }
}

function onSquareClick(r, c) {
    const piece = board[r][c];
    if (selected) {
        // If clicked a legal move, move piece
        if (legalMoves.some(([mr, mc]) => mr === r && mc === c)) {
            movePiece(selected, [r, c]);
            selected = null;
            legalMoves = [];
            renderBoard();
            updateStatus();
            return;
        }
        // Deselect if clicked elsewhere
        selected = null;
        legalMoves = [];
        renderBoard();
        return;
    }
    // Select if it's your turn and your piece
    if (piece && piece[0] === turn) {
        selected = [r, c];
        legalMoves = getLegalMoves(r, c);
        renderBoard();
    }
}

function movePiece([fr, fc], [tr, tc]) {
    board[tr][tc] = board[fr][fc];
    board[fr][fc] = null;
    // Pawn promotion
    if (board[tr][tc][1] === 'P' && (tr === 0 || tr === 7)) {
        board[tr][tc] = board[tr][tc][0] + 'Q';
    }
    turn = turn === 'w' ? 'b' : 'w';
}

function getLegalMoves(r, c) {
    // Basic legal moves (no check/checkmate, no castling, no en passant)
    const piece = board[r][c];
    if (!piece) return [];
    const color = piece[0];
    const type = piece[1];
    const moves = [];
    const directions = {
        N: [[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[-1,2],[1,-2],[1,2]],
        B: [[-1,-1],[1,1],[1,-1],[-1,1]],
        R: [[-1,0],[1,0],[0,-1],[0,1]],
        Q: [[-1,-1],[1,1],[1,-1],[-1,1],[-1,0],[1,0],[0,-1],[0,1]],
        K: [[-1,-1],[1,1],[1,-1],[-1,1],[-1,0],[1,0],[0,-1],[0,1]]
    };
    if (type === 'P') {
        const dir = color === 'w' ? -1 : 1;
        // Forward
        if (inBounds(r+dir, c) && !board[r+dir][c]) moves.push([r+dir, c]);
        // Double move
        if ((color === 'w' && r === 6) || (color === 'b' && r === 1)) {
            if (!board[r+dir][c] && !board[r+2*dir][c]) moves.push([r+2*dir, c]);
        }
        // Captures
        for (let dc of [-1,1]) {
            if (inBounds(r+dir, c+dc) && board[r+dir][c+dc] && board[r+dir][c+dc][0] !== color) {
                moves.push([r+dir, c+dc]);
            }
        }
    } else if (type === 'N') {
        for (let [dr, dc] of directions.N) {
            const nr = r+dr, nc = c+dc;
            if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc][0] !== color)) moves.push([nr, nc]);
        }
    } else if (type === 'B' || type === 'R' || type === 'Q') {
        const dirs = directions[type];
        for (let [dr, dc] of dirs) {
            let nr = r+dr, nc = c+dc;
            while (inBounds(nr, nc)) {
                if (!board[nr][nc]) {
                    moves.push([nr, nc]);
                } else {
                    if (board[nr][nc][0] !== color) moves.push([nr, nc]);
                    break;
                }
                nr += dr; nc += dc;
            }
        }
    } else if (type === 'K') {
        for (let [dr, dc] of directions.K) {
            const nr = r+dr, nc = c+dc;
            if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc][0] !== color)) moves.push([nr, nc]);
        }
    }
    return moves;
}

function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function updateStatus() {
    statusDiv.textContent = (turn === 'w' ? 'White' : 'Black') + "'s turn";
}

function resetGame() {
    board = cloneBoard(initialBoard);
    selected = null;
    legalMoves = [];
    turn = 'w';
    renderBoard();
    updateStatus();
}

resetBtn.addEventListener('click', resetGame);

// Initialize
resetGame();
