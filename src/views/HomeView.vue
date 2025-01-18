<template>
  <div class="home">
    <button @click="startGame('bot')">Jouer contre l'ordinateur</button>
    <button @click="startGame('multiplayer')">Mode multijoueur</button>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  methods: {
    startGame(mode) {
      this.$router.push({ name: 'GameView', params: { mode } });
    }
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #3498db;
  color: #ecf0f1;
  border: none;
  border-radius: 5px;
}
</style>