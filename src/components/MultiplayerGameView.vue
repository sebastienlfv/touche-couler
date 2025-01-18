<template>
  <div class="jeu">
    <h1>Touché-Coulé - Mode Multijoueur</h1>
    <div class="timer">Temps restant: {{ timer }} secondes</div>
    <div class="contenu">
      <div class="regles">
        <h2>Règles du jeu</h2>
        <ul>
          <li>Le but du jeu est de couler tous les navires de l'adversaire.</li>
          <li>Chaque joueur dispose d'une grille de 10x10 cases.</li>
          <li>Les navires peuvent être placés horizontalement ou verticalement.</li>
          <li>Les navires ne peuvent pas se chevaucher.</li>
          <li>Les navires classiques sont :
            <ul>
              <li>1 porte-avions (5 cases)</li>
              <li>1 croiseur (4 cases)</li>
              <li>2 contre-torpilleurs (3 cases chacun)</li>
              <li>1 sous-marin (3 cases)</li>
              <li>1 torpilleur (2 cases)</li>
            </ul>
          </li>
          <li>À chaque tour, un joueur annonce une case de la grille de l'adversaire.</li>
          <li>L'adversaire répond par "touché" ou "manqué".</li>
          <li>Le jeu se termine lorsqu'un joueur a coulé tous les navires de l'adversaire.</li>
        </ul>
      </div>
      <div class="grilles">
        <Grille :grid="playerGrid" :onTir="handleTir" :onPlaceShip="placeShip" :selectedShip="selectedShip" :orientation="orientation" @change-orientation="changeOrientation" />
        <Grille :grid="opponentGrid" :onTir="handleTir" :isOpponent="true" />
      </div>
    </div>
    <div class="navires">
      <Navire v-for="(navire, index) in navires" :key="index" :index="index" :size="navire.size" :remaining="navire.remaining" @select-ship="selectShip" />
    </div>
    <button v-if="!isReady" @click="setReady" :disabled="!canSetReady">PRÊT</button>
  </div>
</template>

<script>
import Grille from "@/components/GrilleComponent.vue";
import Navire from "@/components/NavireComponent.vue";

export default {
  components: {
    Grille,
    Navire,
  },
  data() {
    return {
      playerGrid: Array(100).fill().map(() => ({ touched: false, hit: false, occupied: false })),
      opponentGrid: Array(100).fill().map(() => ({ touched: false, hit: false, occupied: false })),
      navires: [
        { size: 5, remaining: 1 },
        { size: 4, remaining: 1 },
        { size: 3, remaining: 2 },
        { size: 2, remaining: 1 },
      ],
      selectedShip: null,
      placingShip: false,
      isReady: false,
      orientation: 'horizontal',
      timer: 25,
      timerInterval: null,
      currentPlayer: null,
      gameStarted: false,
      ws: null,
    };
  },
  methods: {
    handleTir(index) {
      if (!this.gameStarted || this.currentPlayer !== 'player') return;

      const cell = this.opponentGrid[index];
      if (cell.touched) return;

      cell.touched = true;
      cell.hit = cell.occupied;

      if (cell.hit) {
        alert('Touché !');
      } else {
        alert('Manqué !');
        this.currentPlayer = 'opponent';
        this.resetTimer();
        this.opponentTurn();
      }

      // Envoyer l'événement de tir au serveur WebSocket
      this.ws.send(JSON.stringify({ type: 'tir', index }));
    },
    opponentTurn() {
      setTimeout(() => {
        const availableCells = this.playerGrid.filter(cell => !cell.touched);
        const randomIndex = Math.floor(Math.random() * availableCells.length);
        const cell = availableCells[randomIndex];
        cell.touched = true;
        cell.hit = cell.occupied;

        if (cell.hit) {
          alert('L\'adversaire a touché un de vos navires !');
          this.opponentTurn(); // Rejouer si l'adversaire touche un navire
        } else {
          alert('L\'adversaire a manqué !');
          this.currentPlayer = 'player';
          this.resetTimer();
        }
      }, 1000);
    },
    placeShipsRandomly(grid) {
      const ships = [
        { size: 5 },
        { size: 4 },
        { size: 3 },
        { size: 3 },
        { size: 2 },
      ];

      ships.forEach(ship => {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 100) {
          attempts++;
          const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
          const start = Math.floor(Math.random() * 100);
          const positions = [];

          for (let i = 0; i < ship.size; i++) {
            const position = orientation === 'horizontal' ? start + i : start + i * 10;
            if (position >= 100 || (orientation === 'horizontal' && Math.floor(start / 10) !== Math.floor(position / 10))) {
              break;
            }
            positions.push(position);
          }

          if (positions.length === ship.size && positions.every(pos => !grid[pos].occupied)) {
            positions.forEach(pos => grid[pos].occupied = true);
            placed = true;
          }
        }
        if (!placed) {
          console.error(`Failed to place ship of size ${ship.size} after ${attempts} attempts`);
        }
      });
    },
    selectShip(ship) {
      this.selectedShip = ship;
      this.placingShip = true;
    },
    placeShip(index) {
      if (!this.placingShip || !this.selectedShip) return;

      const positions = [];
      for (let i = 0; i < this.selectedShip.size; i++) {
        const position = this.orientation === 'horizontal' ? index + i : index + i * 10;
        if (position >= 100 || (this.orientation === 'horizontal' && Math.floor(index / 10) !== Math.floor(position / 10))) {
          return;
        }
        positions.push(position);
      }

      if (positions.every(pos => !this.playerGrid[pos].occupied && !this.isAdjacent(pos))) {
        positions.forEach(pos => this.playerGrid[pos].occupied = true);
        this.navires[this.selectedShip.index].remaining--;
        this.selectedShip = null;
        this.placingShip = false;
      }
    },
    isAdjacent(position) {
      const adjacentPositions = [
        position - 1, position + 1,
        position - 10, position + 10,
        position - 11, position - 9,
        position + 11, position + 9
      ];
      return adjacentPositions.some(pos => this.playerGrid[pos] && this.playerGrid[pos].occupied);
    },
    changeOrientation() {
      this.orientation = this.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    },
    setReady() {
      if (this.canSetReady) {
        this.isReady = true;
        alert("Vous êtes prêt !");
        this.startTimer();
        this.startGame();
      }
    },
    startTimer() {
      this.timer = 25;
      this.timerInterval = setInterval(() => {
        if (this.timer > 0) {
          this.timer--;
        } else {
          clearInterval(this.timerInterval);
          alert("Temps écoulé !");
          this.currentPlayer = 'opponent';
          this.resetTimer();
          this.opponentTurn();
        }
      }, 1000);
    },
    resetTimer() {
      clearInterval(this.timerInterval);
      this.timer = 25;
      this.startTimer();
    },
    startGame() {
      this.gameStarted = true;
      this.currentPlayer = Math.random() < 0.5 ? 'player' : 'opponent';
      alert(`Le joueur ${this.currentPlayer === 'player' ? 'commence' : 'adversaire commence'} !`);
      if (this.currentPlayer === 'opponent') {
        this.opponentTurn();
      }
    },
    handleKeydown(event) {
      if (event.key === 'a' || event.key === 'A') {
        this.changeOrientation();
      }
    },
    connectWebSocket() {
      this.ws = new WebSocket('ws://localhost:8080');

      this.ws.onopen = () => {
        console.log('Connected to WebSocket server');
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'tir') {
          this.handleOpponentTir(message.index);
        }
      };

      this.ws.onclose = () => {
        console.log('Disconnected from WebSocket server');
      };
    },
    handleOpponentTir(index) {
      const cell = this.playerGrid[index];
      if (cell.touched) return;

      cell.touched = true;
      cell.hit = cell.occupied;

      if (cell.hit) {
        alert('L\'adversaire a touché un de vos navires !');
      } else {
        alert('L\'adversaire a manqué !');
        this.currentPlayer = 'player';
        this.resetTimer();
      }
    }
  },
  computed: {
    canSetReady() {
      return this.navires.every(navire => navire.remaining === 0);
    }
  },
  mounted() {
    this.placeShipsRandomly(this.opponentGrid);
    window.addEventListener('keydown', this.handleKeydown);
    this.connectWebSocket();
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
};
</script>

<style scoped>
.jeu {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  background-color: #2c3e50;
  color: #ecf0f1;
  min-height: 100vh;
}

.timer {
  font-size: 20px;
  margin-bottom: 10px;
}

.contenu {
  display: flex;
  justify-content: center;
  width: 100%;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  position: relative;
}

.regles {
  max-width: 300px;
  text-align: left;
  position: absolute;
  left: 0;
  background-color: #34495e;
  padding: 10px;
  border-radius: 5px;
  color: #ecf0f1;
}

.grilles {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.navires {
  display: flex;
  margin-top: 20px;
  color: #000;
  cursor: pointer;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #3498db;
  color: #ecf0f1;
  border: none;
  border-radius: 5px;
}

button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}
</style>