import type { App, Component } from 'vue'

import AppModulesMenu from '@/components/AppModulesMenu.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout.vue'
import UiAlert from '@/components/ui/UiAlert.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiLabel from '@/components/ui/UiLabel.vue'

const components: Record<string, Component> = {
  AppModulesMenu,
  AppFooter,
  AppHeader,
  AppSidebar,
  AuthenticatedLayout,
  UiAlert,
  UiBadge,
  UiButton,
  UiCard,
  UiInput,
  UiLabel,
}

export default {
  install(app: App) {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}
