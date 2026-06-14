import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './index.css'

import { Dialog, FeatherIcon } from 'frappe-ui'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.component('Dialog', Dialog)
app.component('FeatherIcon', FeatherIcon)
app.mount('#app')
