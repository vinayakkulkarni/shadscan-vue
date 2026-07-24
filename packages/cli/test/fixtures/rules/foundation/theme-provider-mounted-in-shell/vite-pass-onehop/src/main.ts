import { createApp } from 'vue';
import App from './App.vue';
import { applyTheme } from './theme.js';

applyTheme(true);
createApp(App).mount('#app');
