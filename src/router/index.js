import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import GameView from '@/views/GameView.vue';
import MultiplayerGameView from '@/components/MultiplayerGameView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/game/:mode',
    name: 'GameView',
    component: GameView
  },
  {
    path: '/multiplayer',
    name: 'multiplayer',
    component: MultiplayerGameView
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;