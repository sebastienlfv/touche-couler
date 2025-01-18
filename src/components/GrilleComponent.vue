<template>
  <div :class="['grille', { 'grille-opponent': isOpponent }]">
    <div
      v-for="(cell, index) in grid"
      :key="index"
      :class="['cell', { touched: cell.touched, hit: cell.hit, occupied: cell.occupied && !isOpponent, preview: isPreview(index) }]"
      @click="handleClick(index)"
      @contextmenu.prevent="handleRightClick(index)"
      @mouseover="handleMouseOver(index)"
      @mouseleave="handleMouseLeave"
    >
      <span v-if="!isOpponent">{{ cell.value }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    grid: Array,
    onTir: Function,
    onPlaceShip: Function,
    selectedShip: Object,
    orientation: String,
    isOpponent: Boolean,
  },
  data() {
    return {
      previewPositions: [],
    };
  },
  methods: {
    handleClick(index) {
      if (this.onPlaceShip) {
        this.onPlaceShip(index);
      } else if (!this.grid[index].touched) {
        this.onTir(index);
      }
    },
    handleRightClick() {
      this.$emit('change-orientation');
    },
    handleMouseOver(index) {
      if (!this.selectedShip) return;

      const positions = [];
      for (let i = 0; i < this.selectedShip.size; i++) {
        const position = this.orientation === 'horizontal' ? index + i : index + i * 10;
        if (position >= 100 || (this.orientation === 'horizontal' && Math.floor(index / 10) !== Math.floor(position / 10))) {
          this.previewPositions = [];
          return;
        }
        positions.push(position);
      }

      this.previewPositions = positions;
    },
    handleMouseLeave() {
      this.previewPositions = [];
    },
    isPreview(index) {
      return this.previewPositions.includes(index);
    },
  },
};
</script>

<style scoped>
.grille {
  display: grid;
  grid-template-columns: repeat(10, 40px);
  grid-gap: 2px;
  margin: 20px;
}

.cell {
  width: 30px;
  height: 30px;
  border: 1px solid #000;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #102846;
}

.cell.occupied {
  background-color: #3498db;
}

.cell.touched {
  background-color: #e74c3c;
}

.cell.hit {
  background-color: #2ecc71;
}

.cell.preview {
  background-color: rgba(52, 152, 219, 0.5);
}

.grille-opponent .cell.occupied {
  background-color: #102846; /* Même couleur que le fond pour rendre les cases occupées invisibles */
}
</style>