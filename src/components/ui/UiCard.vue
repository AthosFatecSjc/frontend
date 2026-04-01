<template>
  <section class="ui-card">
    <slot />
  </section>
</template>

<style scoped>
.ui-card {
  border-radius: var(--radius-lg);
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #fff;
  box-shadow: 0 10px 26px rgba(148, 163, 184, 0.12);
}
</style>
