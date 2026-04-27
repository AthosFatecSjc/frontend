import { getAuthUser } from '@/services/authService'
import { getPendingTerms } from '@/services/termsService'
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
      path: '/minha-conta',
      name: 'MinhaConta',
      component: () => import('../pages/MinhaConta.vue'),
    },
    {
      path: '/admin/logs',
      name: 'AdminLogs',
      component: () => import('../pages/AdminLogs.vue'),
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

export default router