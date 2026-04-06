import { createRouter, createWebHistory } from 'vue-router'


const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/minha-conta',
    name: 'MinhaConta',
    component: () => import('@/pages/MinhaConta.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/cadastro',
    name: 'Cadastro',
    component: () => import('@/pages/Cadastro.vue'),
    meta: { public: true },
  },
  {
    path: '/gestao-usuarios',
    name: 'GestaoUsuarios',
    component: () => import('@/pages/GestaoUsuarios.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
