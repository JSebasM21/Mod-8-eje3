class MemoryGame {
    constructor() {
        // Elementos del DOM
        this.board = document.getElementById('gameBoard');
        this.timerEl = document.getElementById('timer');
        this.movesEl = document.getElementById('moves');
        this.scoreEl = document.getElementById('score');
        this.efficiencyEl = document.getElementById('efficiency');
        this.progressText = document.getElementById('progressText');
        this.progressFill = document.getElementById('progressFill');
        this.memorizePanel = document.getElementById('memorizePanel');
        this.memorizeTimerEl = document.getElementById('memorizeTimer');
        
        // Botones
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.hintBtn = document.getElementById('hintBtn');
        
        // Variables del juego
        this.cards = [];
        this.firstCard = null;
        this.secondCard = null;
        this.lock = false;
        this.isPaused = false;
        this.isGameActive = false;
        this.isMemorizing = false;
        
        // Estadísticas
        this.moves = 0;
        this.score = 0;
        this.time = 0;
        this.timer = null;
        this.memorizeTimer = null;
        this.combo = 0;
        this.streak = 0;
        this.maxCombo = 0;
        this.lives = 3;
        this.hints = 3;
        
        // Configuración
        this.difficulty = 'easy';
        this.theme = 'fruits';
        this.gridSize = 4;
        this.totalPairs = 8;
        this.memorizeTime = 3; // Tiempo para memorizar (segundos)
        
        // Temas
        this.themes = {
            fruits: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍒', '🍑', '🍍', '🥭', '🥝', '🍐', '🍊'],
            animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'],
            flags: ['🇺🇸', '🇪🇸', '🇫🇷', '🇩🇪', '🇮🇹', '🇯🇵', '🇨🇳', '🇷🇺', '🇬🇧', '🇧🇷', '🇨🇦', '🇦🇺'],
            emoji: ['😀', '😂', '😍', '😎', '🤩', '🥳', '😜', '🤔', '😴', '🤯', '🥶', '😈'],
            numbers: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '⭐', '💯']
        };
        
        // Mejores puntuaciones
        this.bestTime = localStorage.getItem('memoryBestTime') || 9999;
        this.bestScore = localStorage.getItem('memoryBestScore') || 0;
        this.bestEfficiency = localStorage.getItem('memoryBestEfficiency') || 0;
        this.gamesWon = parseInt(localStorage.getItem('memoryGamesWon')) || 0;
        this.totalMoves = parseInt(localStorage.getItem('memoryTotalMoves')) || 0;
        
        // Historial
        this.history = JSON.parse(localStorage.getItem('memoryHistory')) || [];
        
        // Audio
        this.flipSound = document.getElementById('flipSound');
        this.matchSound = document.getElementById('matchSound');
        this.mismatchSound = document.getElementById('mismatchSound');
        this.winSound = document.getElementById('winSound');
        this.hintSound = document.getElementById('hintSound');
        this.countdownSound = document.getElementById('countdownSound');
        
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.updateBestScores();
        this.updateStats();
        this.loadHistory();
        this.createBoard();
        this.updateLives();
        
        // Inicialmente las cartas están OCULTAS
        this.hideAllCards();
        
        // Mostrar instrucciones iniciales
        this.showNotification('Selecciona dificultad y tema, luego haz clic en "Iniciar Juego"', 'info');
    }

    setupEventListeners() {
        // Botones de control
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.hintBtn.addEventListener('click', () => this.useHint());
        
        // Selector de dificultad
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setDifficulty(e.target.closest('.difficulty-btn').dataset.difficulty);
            });
        });
        
        // Selector de tema
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTheme(e.target.closest('.theme-btn').dataset.theme);
            });
        });
        
        // Modal
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.closeModal();
            this.resetGame();
        });
        document.getElementById('shareBtn').addEventListener('click', () => this.shareResults());
        
        // Limpiar historial
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
    }

    setDifficulty(level) {
        this.difficulty = level;
        
        // Actualizar botones activos
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.difficulty-btn').classList.add('active');
        
        // Configurar según dificultad
        switch(level) {
            case 'easy':
                this.gridSize = 4;
                this.totalPairs = 8;
                this.lives = 3;
                this.memorizeTime = 3;
                break;
            case 'medium':
                this.gridSize = 6;
                this.totalPairs = 12;
                this.lives = 3;
                this.memorizeTime = 4;
                break;
            case 'hard':
                this.gridSize = 6;
                this.totalPairs = 18;
                this.lives = 2;
                this.memorizeTime = 5;
                break;
            case 'expert':
                this.gridSize = 8;
                this.totalPairs = 32;
                this.lives = 1;
                this.memorizeTime = 6;
                break;
        }
        
        this.updateLives();
        this.createBoard();
        this.hideAllCards();
    }

    setTheme(theme) {
        this.theme = theme;
        
        // Actualizar botones activos
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.theme-btn').classList.add('active');
        
        this.createBoard();
        this.hideAllCards();
    }

    createBoard() {
        this.board.innerHTML = '';
        this.board.className = `board ${this.difficulty}`;
        
        // Seleccionar íconos según el tema
        const icons = [...this.themes[this.theme]];
        const selectedIcons = icons.slice(0, this.totalPairs);
        
        // Duplicar y mezclar
        this.cards = [...selectedIcons, ...selectedIcons];
        this.shuffleArray(this.cards);
        
        // Crear cartas
        this.cards.forEach((icon, index) => {
            const card = document.createElement('div');
            card.className = 'card'; // Inicialmente NO volteada
            card.dataset.icon = icon;
            card.dataset.index = index;
            
            const front = document.createElement('div');
            front.className = 'card-front';
            front.textContent = icon;
            
            const back = document.createElement('div');
            back.className = 'card-back';
            back.innerHTML = '<i class="fas fa-question"></i>';
            
            card.appendChild(front);
            card.appendChild(back);
            
            card.addEventListener('click', () => this.handleCardClick(card));
            
            this.board.appendChild(card);
        });
        
        this.updateProgress();
    }

    showAllCards() {
        // Mostrar todas las cartas para memorización
        const allCards = document.querySelectorAll('.card');
        allCards.forEach(card => {
            card.classList.add('flipped');
        });
    }

    hideAllCards() {
        // Ocultar todas las cartas
        const allCards = document.querySelectorAll('.card');
        allCards.forEach(card => {
            card.classList.remove('flipped');
        });
    }

    startGame() {
        if (this.isGameActive || this.isMemorizing) return;
        
        // Resetear estadísticas del juego
        this.resetGameStats();
        
        // Bloquear botones durante memorización
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = true;
        this.hintBtn.disabled = true;
        this.resetBtn.disabled = true;
        
        // Mostrar panel de memorización
        this.memorizePanel.classList.add('show');
        this.isMemorizing = true;
        
        // Mostrar TODAS las cartas para memorizar
        this.showAllCards();
        
        // Mostrar notificación
        this.showNotification(`Memoriza las cartas por ${this.memorizeTime} segundos...`, 'info');
        
        // Iniciar cuenta regresiva para memorización
        let countdown = this.memorizeTime;
        this.memorizeTimerEl.textContent = countdown;
        
        // Cuenta regresiva
        this.memorizeTimer = setInterval(() => {
            countdown--;
            this.memorizeTimerEl.textContent = countdown;
            
            // Sonido de cuenta regresiva
            if (countdown <= 3 && countdown > 0) {
                this.playSound('countdown');
            }
            
            if (countdown <= 0) {
                clearInterval(this.memorizeTimer);
                this.startActualGame();
            }
        }, 1000);
    }

    resetGameStats() {
        // Resetear solo las estadísticas del juego actual
        this.moves = 0;
        this.score = 0;
        this.time = 0;
        this.combo = 0;
        this.streak = 0;
        this.maxCombo = 0;
        this.lives = this.difficulty === 'hard' ? 2 : (this.difficulty === 'expert' ? 1 : 3);
        this.hints = 3;
        
        this.movesEl.textContent = '0';
        this.scoreEl.textContent = '0';
        this.efficiencyEl.textContent = '0%';
        this.timerEl.textContent = '00:00';
        
        this.updateLives();
        this.updateProgress();
        this.updateCombo();
        
        // Remover clases de cartas anteriores
        const allCards = document.querySelectorAll('.card');
        allCards.forEach(card => {
            card.classList.remove('matched', 'incorrect', 'hinted', 'flipped');
        });
        
        // Mezclar las cartas para un nuevo juego
        this.shuffleCards();
    }

    shuffleCards() {
        // Mezclar las cartas actuales
        const cardsArray = Array.from(document.querySelectorAll('.card'));
        const icons = cardsArray.map(card => card.dataset.icon);
        
        // Mezclar los íconos
        this.shuffleArray(icons);
        
        // Asignar los íconos mezclados a las cartas
        cardsArray.forEach((card, index) => {
            card.dataset.icon = icons[index];
            card.querySelector('.card-front').textContent = icons[index];
        });
    }

    startActualGame() {
        // Ocultar panel de memorización
        this.memorizePanel.classList.remove('show');
        this.isMemorizing = false;
        
        // Ocultar todas las cartas
        this.hideAllCards();
        
        // Habilitar botones
        this.resetBtn.disabled = false;
        
        // Iniciar juego real
        this.isGameActive = true;
        this.isPaused = false;
        this.pauseBtn.disabled = false;
        this.hintBtn.disabled = false;
        this.pauseBtn.textContent = 'Pausar';
        this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
        
        this.startTimer();
        this.showNotification('¡Comienza el juego! Encuentra las parejas', 'success');
    }

    togglePause() {
        if (!this.isGameActive || this.isMemorizing) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            clearInterval(this.timer);
            this.pauseBtn.textContent = 'Reanudar';
            this.pauseBtn.innerHTML = '<i class="fas fa-play"></i> Reanudar';
            this.showNotification('Juego pausado', 'warning');
        } else {
            this.startTimer();
            this.pauseBtn.textContent = 'Pausar';
            this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
            this.showNotification('Juego reanudado', 'info');
        }
    }

    startTimer() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.isPaused && !this.isMemorizing) {
                this.time++;
                this.updateTimer();
            }
        }, 1000);
    }

    updateTimer() {
        const minutes = Math.floor(this.time / 60).toString().padStart(2, '0');
        const seconds = (this.time % 60).toString().padStart(2, '0');
        this.timerEl.textContent = `${minutes}:${seconds}`;
    }

    handleCardClick(card) {
        if (!this.isGameActive || this.isPaused || this.isMemorizing) return;
        if (this.lock) return;
        if (card.classList.contains('flipped')) return;
        if (card.classList.contains('matched')) return;
        
        this.flipCard(card);
        
        if (!this.firstCard) {
            this.firstCard = card;
        } else {
            this.secondCard = card;
            this.checkMatch();
        }
    }

    flipCard(card) {
        card.classList.add('flipped');
        this.playSound('flip');
        this.moves++;
        this.movesEl.textContent = this.moves;
    }

    checkMatch() {
        this.lock = true;
        
        const isMatch = this.firstCard.dataset.icon === this.secondCard.dataset.icon;
        
        if (isMatch) {
            this.handleMatch();
        } else {
            this.handleMismatch();
        }
        
        this.updateEfficiency();
        this.updateProgress();
    }

    handleMatch() {
        this.firstCard.classList.add('matched');
        this.secondCard.classList.add('matched');
        
        // Aumentar combo
        this.combo++;
        this.streak++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        // Calcular puntuación con combo
        let points = 10;
        if (this.combo > 1) {
            points *= this.combo; // Multiplicador de combo
        }
        
        this.score += points;
        this.scoreEl.textContent = this.score;
        
        this.playSound('match');
        this.showNotification(`¡Combo ${this.combo}x! +${points} puntos`, 'success');
        
        this.updateCombo();
        this.resetSelection();
        this.checkWin();
    }

    handleMismatch() {
        // Perder vida
        this.lives--;
        this.updateLives();
        
        // Resetear combo
        this.combo = 0;
        this.streak = 0;
        
        // Mostrar error
        this.firstCard.classList.add('incorrect');
        this.secondCard.classList.add('incorrect');
        
        this.playSound('mismatch');
        this.showNotification('¡Incorrecto! -1 vida', 'error');
        
        setTimeout(() => {
            this.firstCard.classList.remove('flipped', 'incorrect');
            this.secondCard.classList.remove('flipped', 'incorrect');
            this.resetSelection();
            
            // Verificar si perdió
            if (this.lives <= 0) {
                this.gameOver();
            }
        }, 1000);
    }

    resetSelection() {
        this.firstCard = null;
        this.secondCard = null;
        this.lock = false;
        this.updateCombo();
    }

    updateCombo() {
        const comboEl = document.getElementById('comboValue');
        const streakEl = document.getElementById('streakValue');
        
        comboEl.textContent = `${this.combo}x`;
        streakEl.textContent = this.streak;
        
        // Animación de combo
        if (this.combo > 1) {
            document.getElementById('comboCounter').classList.add('pulse');
            setTimeout(() => {
                document.getElementById('comboCounter').classList.remove('pulse');
            }, 300);
        }
    }

    updateLives() {
        const livesContainer = document.getElementById('livesContainer');
        livesContainer.innerHTML = '';
        
        for (let i = 0; i < this.lives; i++) {
            const heart = document.createElement('i');
            heart.className = 'fas fa-heart';
            livesContainer.appendChild(heart);
        }
        
        // Agregar corazones perdidos (vacíos)
        for (let i = this.lives; i < 3; i++) {
            const heart = document.createElement('i');
            heart.className = 'fas fa-heart-broken';
            heart.style.color = 'var(--color-text-light)';
            heart.style.opacity = '0.5';
            livesContainer.appendChild(heart);
        }
    }

    updateProgress() {
        const matchedCards = document.querySelectorAll('.matched').length / 2;
        const totalPairs = this.totalPairs;
        const percentage = (matchedCards / totalPairs) * 100;
        
        this.progressText.textContent = `${matchedCards}/${totalPairs}`;
        this.progressFill.style.width = `${percentage}%`;
    }

    updateEfficiency() {
        const matchedPairs = document.querySelectorAll('.matched').length / 2;
        const efficiency = matchedPairs > 0 ? Math.round((matchedPairs / this.moves) * 100) : 0;
        this.efficiencyEl.textContent = `${efficiency}%`;
    }

    useHint() {
        if (this.hints <= 0 || !this.isGameActive || this.isPaused || this.isMemorizing) {
            this.showNotification('Sin pistas disponibles', 'warning');
            return;
        }
        
        this.hints--;
        this.playSound('hint');
        
        // Encontrar cartas no emparejadas y no volteadas
        const unflippedCards = Array.from(document.querySelectorAll('.card:not(.flipped):not(.matched)'));
        
        if (unflippedCards.length >= 2) {
            // Encontrar un par completo
            let card1, card2;
            
            for (let i = 0; i < unflippedCards.length; i++) {
                const currentCard = unflippedCards[i];
                const matchingCard = unflippedCards.find(card => 
                    card !== currentCard && card.dataset.icon === currentCard.dataset.icon
                );
                
                if (matchingCard) {
                    card1 = currentCard;
                    card2 = matchingCard;
                    break;
                }
            }
            
            if (card1 && card2) {
                // Mostrar el par por 1.5 segundos
                card1.classList.add('hinted', 'flipped');
                card2.classList.add('hinted', 'flipped');
                
                setTimeout(() => {
                    card1.classList.remove('hinted', 'flipped');
                    card2.classList.remove('hinted', 'flipped');
                }, 1500);
                
                this.showNotification(`Pista usada (${this.hints} restantes)`, 'info');
            }
        }
    }

    checkWin() {
        const matchedCards = document.querySelectorAll('.matched');
        
        if (matchedCards.length === this.cards.length) {
            this.winGame();
        }
    }

    winGame() {
        clearInterval(this.timer);
        this.isGameActive = false;
        
        // Calcular estadísticas finales
        const efficiency = Math.round((this.totalPairs / this.moves) * 100);
        const finalTime = this.time;
        
        // Actualizar mejores puntuaciones
        if (finalTime < this.bestTime) {
            this.bestTime = finalTime;
            localStorage.setItem('memoryBestTime', this.bestTime);
        }
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('memoryBestScore', this.bestScore);
        }
        
        if (efficiency > this.bestEfficiency) {
            this.bestEfficiency = efficiency;
            localStorage.setItem('memoryBestEfficiency', this.bestEfficiency);
        }
        
        // Actualizar estadísticas
        this.gamesWon++;
        this.totalMoves += this.moves;
        localStorage.setItem('memoryGamesWon', this.gamesWon);
        localStorage.setItem('memoryTotalMoves', this.totalMoves);
        
        // Agregar al historial
        this.addToHistory(finalTime, this.moves, this.score, efficiency);
        
        // Actualizar UI
        this.updateBestScores();
        this.updateStats();
        
        // Mostrar modal de victoria
        this.showWinModal(finalTime, this.moves, this.score, efficiency);
        
        this.playSound('win');
    }

    gameOver() {
        clearInterval(this.timer);
        this.isGameActive = false;
        
        this.showNotification('¡Juego terminado! Se te acabaron las vidas', 'error');
        
        setTimeout(() => {
            this.resetGame();
        }, 2000);
    }

    showWinModal(time, moves, score, efficiency) {
        const modal = document.getElementById('winModal');
        const minutes = Math.floor(time / 60).toString().padStart(2, '0');
        const seconds = (time % 60).toString().padStart(2, '0');
        
        // Actualizar estadísticas en el modal
        document.getElementById('victoryTime').textContent = `${minutes}:${seconds}`;
        document.getElementById('victoryMoves').textContent = moves;
        document.getElementById('victoryScore').textContent = score;
        document.getElementById('victoryEfficiency').textContent = `${efficiency}%`;
        document.getElementById('victoryCombo').textContent = `${this.maxCombo}x`;
        
        // Mostrar logros
        this.showAchievements(time, moves, score, efficiency);
        
        // Calificar estrellas
        this.calculateStars(efficiency, moves, time);
        
        modal.classList.add('show');
    }

    showAchievements(time, moves, score, efficiency) {
        const achievementsEl = document.getElementById('victoryAchievements');
        achievementsEl.innerHTML = '';
        
        const achievements = [];
        
        // Verificar logros
        if (time < 60) achievements.push('Velocista: Menos de 1 minuto');
        if (moves <= this.totalPairs * 1.5) achievements.push('Eficiente: Pocos movimientos');
        if (efficiency >= 80) achievements.push('Preciso: Alta eficiencia');
        if (this.combo >= 3) achievements.push('Combo Master: Racha de combos');
        if (this.hints === 3) achievements.push('Sin Ayuda: No usaste pistas');
        if (this.lives === 3) achievements.push('Invencible: Sin perder vidas');
        
        achievements.forEach(achievement => {
            const div = document.createElement('div');
            div.className = 'achievement unlocked';
            div.innerHTML = `<i class="fas fa-trophy"></i> ${achievement}`;
            achievementsEl.appendChild(div);
        });
    }

    calculateStars(efficiency, moves, time) {
        const starsEl = document.getElementById('victoryStars');
        starsEl.innerHTML = '';
        
        let stars = 0;
        
        // Sistema de estrellas
        if (efficiency >= 60) stars++;
        if (efficiency >= 75) stars++;
        if (efficiency >= 90) stars++;
        if (moves <= this.totalPairs * 1.2) stars++;
        if (time < this.totalPairs * 5) stars++; // Menos de 5 segundos por par
        
        stars = Math.min(stars, 5); // Máximo 5 estrellas
        
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('i');
            star.className = `star fas fa-star ${i < stars ? 'filled' : ''}`;
            starsEl.appendChild(star);
        }
    }

    closeModal() {
        document.getElementById('winModal').classList.remove('show');
    }

    addToHistory(time, moves, score, efficiency) {
        const historyItem = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            time: time,
            moves: moves,
            score: score,
            efficiency: efficiency,
            difficulty: this.difficulty,
            theme: this.theme
        };
        
        this.history.unshift(historyItem);
        
        // Limitar historial a 20 partidas
        if (this.history.length > 20) {
            this.history.pop();
        }
        
        localStorage.setItem('memoryHistory', JSON.stringify(this.history));
        this.loadHistory();
    }

    loadHistory() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        
        this.history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            
            const minutes = Math.floor(item.time / 60).toString().padStart(2, '0');
            const seconds = (item.time % 60).toString().padStart(2, '0');
            
            div.innerHTML = `
                <div class="history-info">
                    <span class="history-time">${item.date}</span>
                    <span>${item.difficulty.toUpperCase()} - ${item.theme}</span>
                </div>
                <div class="history-stats">
                    <span class="history-stat">${minutes}:${seconds}</span>
                    <span class="history-stat">${item.moves} mov</span>
                    <span class="history-stat">${item.score} pts</span>
                </div>
            `;
            
            historyList.appendChild(div);
        });
    }

    clearHistory() {
        if (confirm('¿Estás seguro de que quieres borrar el historial?')) {
            this.history = [];
            localStorage.removeItem('memoryHistory');
            this.loadHistory();
            this.showNotification('Historial borrado', 'info');
        }
    }

    shareResults() {
        const text = `🎮 Acabo de jugar Memoria Pro:\n`
                   + `⏱️ Tiempo: ${document.getElementById('victoryTime').textContent}\n`
                   + `🔄 Movimientos: ${document.getElementById('victoryMoves').textContent}\n`
                   + `⭐ Puntuación: ${document.getElementById('victoryScore').textContent}\n`
                   + `🏆 ¡Inténtalo tú también!`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Memoria Pro - Resultados',
                text: text,
                url: window.location.href
            });
        } else {
            // Fallback para copiar al portapapeles
            navigator.clipboard.writeText(text);
            this.showNotification('Resultados copiados al portapapeles', 'info');
        }
    }

    resetGame() {
        clearInterval(this.timer);
        clearInterval(this.memorizeTimer);
        this.isGameActive = false;
        this.isPaused = false;
        this.isMemorizing = false;
        
        // Ocultar panel de memorización
        this.memorizePanel.classList.remove('show');
        
        // Habilitar botones
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.hintBtn.disabled = true;
        this.resetBtn.disabled = false;
        
        this.pauseBtn.textContent = 'Pausar';
        this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
        
        // Ocultar todas las cartas
        this.hideAllCards();
        
        this.showNotification('Juego reiniciado. Haz clic en "Iniciar Juego" para comenzar', 'info');
    }

    updateBestScores() {
        const minutes = Math.floor(this.bestTime / 60).toString().padStart(2, '0');
        const seconds = (this.bestTime % 60).toString().padStart(2, '0');
        
        document.getElementById('bestTime').textContent = `${minutes}:${seconds}`;
        document.getElementById('bestScore').textContent = this.bestScore;
        document.getElementById('bestEfficiency').textContent = `${this.bestEfficiency}%`;
    }

    updateStats() {
        document.getElementById('gamesWon').textContent = this.gamesWon;
        
        const avgTime = this.gamesWon > 0 ? Math.floor(this.totalMoves / this.gamesWon) : 0;
        const avgMinutes = Math.floor(avgTime / 60).toString().padStart(2, '0');
        const avgSeconds = (avgTime % 60).toString().padStart(2, '0');
        
        document.getElementById('avgTime').textContent = `${avgMinutes}:${avgSeconds}`;
        document.getElementById('totalMoves').textContent = this.totalMoves;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    playSound(type) {
        try {
            const sound = {
                flip: this.flipSound,
                match: this.matchSound,
                mismatch: this.mismatchSound,
                win: this.winSound,
                hint: this.hintSound,
                countdown: this.countdownSound
            }[type];
            
            if (sound) {
                sound.currentTime = 0;
                sound.volume = 0.5;
                sound.play().catch(e => console.log('Error reproduciendo sonido'));
            }
        } catch (e) {
            console.log('Error en sistema de sonido');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">${message}</div>
            <button class="notification-close">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Botón de cerrar
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Inicializar el juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const game = new MemoryGame();
    
    // Exponer globalmente para debugging
    window.memoryGame = game;
    
    // Mostrar mensaje de bienvenida
    setTimeout(() => {
        game.showNotification('¡Bienvenido a Memoria Pro! Selecciona dificultad y tema, luego haz clic en "Iniciar Juego"', 'info');
    }, 1000);
});