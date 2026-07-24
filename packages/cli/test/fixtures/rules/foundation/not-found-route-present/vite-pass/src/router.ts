import { createRouter, createWebHistory } from 'vue-router';
import Home from './Home.vue';
import NotFound from './NotFound.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  ],
});
