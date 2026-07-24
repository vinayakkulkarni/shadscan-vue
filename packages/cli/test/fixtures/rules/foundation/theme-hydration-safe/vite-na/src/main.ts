import { createApp } from 'vue';
import App from './App.vue';

const stored = localStorage.getItem('theme');
console.log(stored);
createApp(App).mount('#app');
