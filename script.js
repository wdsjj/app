new Vue({
    el: '#app',
    data: {
        board: [],
        solution: [],
        selectedCell: null,
        difficulty: 'medium',
        difficulties: [
            { label: '简单', value: 'easy' },
            { label: '中等', value: 'medium' },
            { label: '困难', value: 'hard' }
        ],
        showRules: false,
        showCelebration: false,
        showMobileNumpad: false,
        gameStatus: '准备开始',
        gameCompleted: false
    },
    computed: {
        totalCells() {
            return 81;
        },
        filledCells() {
            let count = 0;
            for (let row of this.board) {
                for (let cell of row) {
                    if (cell.value) count++;
                }
            }
            return count;
        },
        statusColor() {
            if (this.gameCompleted) return 'success';
            if (this.hasErrors()) return 'error';
            return 'warning';
        }
    },
    mounted() {
        this.initGame();
        this.setupKeyboard();
        this.checkMobile();
        window.addEventListener('resize', this.checkMobile);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.checkMobile);
    },
    methods: {
        initGame() {
            this.generatePuzzle();
            this.gameStatus = '开始游戏';
            this.gameCompleted = false;
            this.showCelebration = false;
            this.selectedCell = null;
        },
        generatePuzzle() {
            this.solution = this.generateSudoku();
            this.board = this.createPuzzle(this.solution);
        },
        generateSudoku() {
            const board = Array(9).fill(null).map(() => Array(9).fill(0));
            this.fillBoard(board);
            return board;
        },
        fillBoard(board) {
            const empty = this.findEmpty(board);
            if (!empty) return true;
            
            const [row, col] = empty;
            const nums = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            
            for (let num of nums) {
                if (this.isValid(board, row, col, num)) {
                    board[row][col] = num;
                    if (this.fillBoard(board)) return true;
                    board[row][col] = 0;
                }
            }
            return false;
        },
        findEmpty(board) {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) return [row, col];
                }
            }
            return null;
        },
        isValid(board, row, col, num) {
            for (let i = 0; i < 9; i++) {
                if (board[row][i] === num) return false;
            }
            
            for (let i = 0; i < 9; i++) {
                if (board[i][col] === num) return false;
            }
            
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (board[boxRow + i][boxCol + j] === num) return false;
                }
            }
            
            return true;
        },
        shuffle(array) {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        },
        createPuzzle(solution) {
            const board = solution.map(row => 
                row.map(val => ({
                    value: val,
                    original: true,
                    error: false
                }))
            );
            
            const removeCount = this.getRemoveCount();
            let removed = 0;
            const positions = [];
            
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    positions.push([i, j]);
                }
            }
            
            const shuffledPositions = this.shuffle(positions);
            
            for (let [row, col] of shuffledPositions) {
                if (removed >= removeCount) break;
                board[row][col] = {
                    value: 0,
                    original: false,
                    error: false
                };
                removed++;
            }
            
            return board;
        },
        getRemoveCount() {
            switch (this.difficulty) {
                case 'easy': return 30;
                case 'medium': return 40;
                case 'hard': return 50;
                default: return 40;
            }
        },
        selectCell(row, col) {
            if (!this.board[row][col].original) {
                this.selectedCell = { row, col };
            }
        },
        inputNumber(num) {
            if (!this.selectedCell) return;
            const { row, col } = this.selectedCell;
            if (this.board[row][col].original) return;
            
            this.board[row][col].value = num;
            this.board[row][col].error = !this.checkValue(row, col, num);
            
            this.updateStatus();
            this.checkWin();
        },
        clearCell() {
            if (!this.selectedCell) return;
            const { row, col } = this.selectedCell;
            if (this.board[row][col].original) return;
            
            this.board[row][col].value = 0;
            this.board[row][col].error = false;
            this.updateStatus();
        },
        checkValue(row, col, num) {
            return this.solution[row][col] === num;
        },
        hasErrors() {
            for (let row of this.board) {
                for (let cell of row) {
                    if (cell.error) return true;
                }
            }
            return false;
        },
        isComplete() {
            for (let row of this.board) {
                for (let cell of row) {
                    if (cell.value === 0 || cell.error) return false;
                }
            }
            return true;
        },
        checkWin() {
            if (this.isComplete()) {
                this.gameCompleted = true;
                this.gameStatus = '恭喜完成！';
                setTimeout(() => {
                    this.showCelebration = true;
                }, 500);
            }
        },
        updateStatus() {
            if (this.gameCompleted) {
                this.gameStatus = '恭喜完成！';
            } else if (this.hasErrors()) {
                this.gameStatus = '存在错误';
            } else {
                this.gameStatus = '进行中';
            }
        },
        setDifficulty(level) {
            this.difficulty = level;
            this.initGame();
        },
        newGame() {
            this.showCelebration = false;
            this.initGame();
        },
        toggleRules() {
            this.showRules = !this.showRules;
        },
        showHint() {
            const emptyCells = [];
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (!this.board[row][col].original && this.board[row][col].value === 0) {
                        emptyCells.push({ row, col });
                    }
                }
            }
            
            if (emptyCells.length === 0) return;
            
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[randomCell.row][randomCell.col].value = this.solution[randomCell.row][randomCell.col];
            this.board[randomCell.row][randomCell.col].error = false;
            
            this.updateStatus();
            this.checkWin();
        },
        isHighlighted(row, col) {
            if (!this.selectedCell) return false;
            const { row: selRow, col: selCol } = this.selectedCell;
            
            if (row === selRow || col === selCol) return true;
            
            const boxRow = Math.floor(row / 3);
            const boxCol = Math.floor(col / 3);
            const selBoxRow = Math.floor(selRow / 3);
            const selBoxCol = Math.floor(selCol / 3);
            
            if (boxRow === selBoxRow && boxCol === selBoxCol) return true;
            
            if (this.board[row][col].value && this.board[selRow][selCol].value) {
                return this.board[row][col].value === this.board[selRow][selCol].value;
            }
            
            return false;
        },
        setupKeyboard() {
            document.addEventListener('keydown', (e) => {
                if (this.showCelebration) return;
                
                if (e.key >= '1' && e.key <= '9') {
                    this.inputNumber(parseInt(e.key));
                } else if (e.key === 'Backspace' || e.key === 'Delete') {
                    this.clearCell();
                } else if (e.key === 'ArrowUp' && this.selectedCell) {
                    e.preventDefault();
                    const newRow = Math.max(0, this.selectedCell.row - 1);
                    if (!this.board[newRow][this.selectedCell.col].original) {
                        this.selectedCell = { row: newRow, col: this.selectedCell.col };
                    }
                } else if (e.key === 'ArrowDown' && this.selectedCell) {
                    e.preventDefault();
                    const newRow = Math.min(8, this.selectedCell.row + 1);
                    if (!this.board[newRow][this.selectedCell.col].original) {
                        this.selectedCell = { row: newRow, col: this.selectedCell.col };
                    }
                } else if (e.key === 'ArrowLeft' && this.selectedCell) {
                    e.preventDefault();
                    const newCol = Math.max(0, this.selectedCell.col - 1);
                    if (!this.board[this.selectedCell.row][newCol].original) {
                        this.selectedCell = { row: this.selectedCell.row, col: newCol };
                    }
                } else if (e.key === 'ArrowRight' && this.selectedCell) {
                    e.preventDefault();
                    const newCol = Math.min(8, this.selectedCell.col + 1);
                    if (!this.board[this.selectedCell.row][newCol].original) {
                        this.selectedCell = { row: this.selectedCell.row, col: newCol };
                    }
                }
            });
        },
        checkMobile() {
            this.showMobileNumpad = window.innerWidth < 768;
        }
    }
});