import { createRouter, createWebHistory } from 'vue-router'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/indicadores',
      name: 'Indicadores',
      component: () => import('../pages/Indicadores.vue'),
    },
  ],
})

export default router
