import { createApp } from 'vue'

import App from './App.vue'
import uiPlugin from './plugins/ui'
import router from './router'
import './styles.css'
import '@mdi/font/css/materialdesignicons.css'
import vuetify from './plugins/vuetify'

const app = createApp(App)

app.use(router)
app.use(uiPlugin)
app.use(vuetify)

app.mount('#app')
