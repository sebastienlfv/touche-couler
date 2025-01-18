<template>
  <div class="navire" @click="selectShip">
    <span>Navire {{ index + 1 }} ({{ size }} cases) - Restant: {{ remaining }}</span>
  </div>
</template>

<script>
export default {
  props: {
    index: Number,
    size: Number,
    remaining: Number,
  },
  methods: {
    selectShip() {
      if (this.remaining > 0) {
        this.$emit('select-ship', { size: this.size, index: this.index });
      }
    }
  }
};
</script>

<style scoped>
.navire {
  padding: 5px;
  margin: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  cursor: pointer;
}
</style>