import { createRouter, createWebHistory } from 'vue-router'

import { getAccessToken, hasAdminAccess } from '@/services/authService'

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
      path: '/consentimentos-pendentes',
      name: 'PendingTerms',
      component: () => import('../pages/PendingTerms.vue'),
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../pages/Dashboard.vue'),
    },
    {
      path: '/minha-conta',
      name: 'MinhaConta',
      component: () => import('../pages/MinhaConta.vue'),
    },
    {
      path: '/admin/logs',
      name: 'AdminLogs',
      component: () => import('../pages/AdminLogs.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/usuarios',
      name: 'AdminUsuarios',
      component: () => import('../pages/AdminUsuarios.vue'),
      meta: { requiresAdmin: true },
    },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.requiresAdmin) {
    return true
  }

  if (!getAccessToken()) {
    if (import.meta.env.DEV) {
      return true
    }

    return '/login'
  }

  if (!hasAdminAccess()) {
    return '/dashboard'
  }

  return true
})

export default router
