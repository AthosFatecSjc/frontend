<script setup lang="ts">
import { computed } from 'vue'

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    eyebrow?: string
    level?: HeadingLevel
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    subtitle: '',
    eyebrow: '',
    level: 1,
    size: 'md',
  },
)

const headingTag = computed(() => `h${props.level}`)
</script>

<template>
  <header class="app-heading" :class="`app-heading--${size}`">
    <p v-if="eyebrow" class="app-heading-eyebrow">{{ eyebrow }}</p>
    <component :is="headingTag" class="app-heading-title">{{ title }}</component>
    <p v-if="subtitle" class="app-heading-subtitle">{{ subtitle }}</p>
  </header>
</template>

<style scoped>
.app-heading {
  display: grid;
  gap: 8px;
}

.app-heading-eyebrow {
  margin: 0;
  color: #49a3c6;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-weight: 700;
  font-size: 12px;
  line-height: 1.2;
}

.app-heading-title {
  margin: 0;
  color: #18213b;
  letter-spacing: -0.01em;
  line-height: 1.15;
}

.app-heading-subtitle {
  margin: 0;
  color: #65748c;
  line-height: 1.45;
}

.app-heading--sm .app-heading-title {
  font-size: clamp(1.1rem, 1rem + 0.4vw, 1.35rem);
  font-weight: 700;
}

.app-heading--sm .app-heading-subtitle {
  font-size: 0.9rem;
}

.app-heading--md .app-heading-title {
  font-size: clamp(1.35rem, 1.15rem + 0.8vw, 1.85rem);
  font-weight: 700;
}

.app-heading--md .app-heading-subtitle {
  font-size: clamp(0.95rem, 0.9rem + 0.2vw, 1.05rem);
}

.app-heading--lg .app-heading-title {
  font-size: clamp(1.6rem, 1.25rem + 1.2vw, 2.2rem);
  font-weight: 700;
}

.app-heading--lg .app-heading-subtitle {
  font-size: clamp(1rem, 0.93rem + 0.3vw, 1.1rem);
}
</style>
