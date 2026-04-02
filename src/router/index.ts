import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../pages/Login.vue'),
    },
    {
      path: '/cadastro',
      name: 'Cadastro',
      component: () => import('../pages/Cadastro.vue'),
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../pages/Dashboard.vue'),
    },
    {
      path: '/indicadores',
      name: 'Indicadores',
      component: () => import('../pages/Indicadores.vue'),
    },
    {
      path: '/minha-conta',
      name: 'MinhaConta',
      component: () => import('../pages/MinhaConta.vue'),
    },
  ],
})

export default router
