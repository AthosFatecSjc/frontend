import { createApp } from 'vue'
import App from './App.vue'
import uiPlugin from './plugins/ui'
import router from './router'
import 'leaflet/dist/leaflet.css'
import './styles.css'

const app = createApp(App)

app.use(router)
app.use(uiPlugin)

app.mount('#app')
