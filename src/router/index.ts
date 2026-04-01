import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/minha-conta',
    },
    {
      path: '/minha-conta',
      name: 'MinhaConta',
      component: () => import('../pages/MinhaConta.vue'),
    },
  ],
})

export default router
