import { createApp } from 'vue'
import App from './App.vue'
import uiPlugin from './plugins/ui'
import router from './router'
import Chart from 'chart.js/auto'
import 'leaflet/dist/leaflet.css'
import './styles.css'

const app = createApp(App)

// Tornar Chart.js disponível globalmente
;(window as any).Chart = Chart

app.use(router)
app.use(uiPlugin)

app.mount('#app')
