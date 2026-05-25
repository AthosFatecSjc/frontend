import { getAuthUser } from '@/services/authService'
import { getPendingTerms } from '@/services/termsService'
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
      meta: {
        whitelistRequiredTermsAcceptance: true,
        whitelistRequiredLogin: true,
      },
    },
    {
      path: '/cadastro',
      name: 'Cadastro',
      component: () => import('../pages/Cadastro.vue'),
      meta: {
        whitelistRequiredTermsAcceptance: true,
        whitelistRequiredLogin: true,
      },
    },
    {
      path: '/consentimentos-pendentes',
      name: 'PendingTerms',
      component: () => import('../pages/PendingTerms.vue'),
      meta: {
        whitelistRequiredTermsAcceptance: true
      },
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../pages/Dashboard.vue'),
    },
    {
      path: '/mapa-calor',
      name: 'MapaCalor',
      component: () => import('../pages/MapaCalor.vue'),
    },
    {
      path: '/minha-conta',
      name: 'MinhaConta',
      component: () => import('../pages/MinhaConta.vue'),
    },
    {
      path: '/testes/login-sharing',
      name: 'LoginSharingTest',
      component: () => import('../pages/LoginSharingTest.vue'),
    },
    {
      path: '/testes/login-sharing/consent',
      name: 'LoginSharingConsentPopup',
      component: () => import('../pages/LoginSharingConsentPopup.vue'),
      meta: {
        whitelistRequiredTermsAcceptance: true,
      },
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

// Global route guard to check for authentication before allowing access to routes that require login
router.beforeEach((to) => !to.meta.whitelistRequiredLogin && !getAuthUser()
  ? { name: 'Login' }
  : true
)

// Global route guard to check for pending terms before allowing access to routes that require terms acceptance
router.beforeEach(async (to) => {
  try {
    if (to.meta.whitelistRequiredTermsAcceptance) return true

    return (await getPendingTerms()).some(term => term.required)
      ? { name: 'PendingTerms' }
      : true

  } catch (error) {
    console.error('Error during route guard:', error)
    // In case of any error (e.g., network issues), allow navigation but log the error
  }

  return true
})

router.beforeEach((to) => {
  if (!to.meta.requiresAdmin) {
    return true
  }

  if (!getAccessToken()) {
    return '/login'
  }

  if (!hasAdminAccess()) {
    return '/dashboard'
  }

  return true
})

export default router