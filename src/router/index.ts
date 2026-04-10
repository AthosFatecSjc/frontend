import { createRouter, createWebHistory } from 'vue-router'
import { isAdmin, isAuthenticated, mustChangePassword } from '../services/authService'

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
      meta: { requiresAuth: true },
    },
    {
      path: '/minha-conta',
      name: 'MinhaConta',
      component: () => import('../pages/MinhaConta.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/logs',
      name: 'AdminLogs',
      component: () => import('../pages/AdminLogs.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})

router.beforeEach((to) => {
  const authenticated = isAuthenticated()
  const requiresAuth = to.meta.requiresAuth === true
  const requiresAdmin = to.meta.requiresAdmin === true

  if (authenticated && to.path === '/login') {
    return '/minha-conta'
  }

  if (requiresAuth && !authenticated) {
    return '/login'
  }

  if (authenticated && requiresAdmin && !isAdmin()) {
    return '/minha-conta'
  }

  if (authenticated && mustChangePassword() && to.path !== '/minha-conta' && to.path !== '/login') {
    return '/minha-conta'
  }
})

export default router
