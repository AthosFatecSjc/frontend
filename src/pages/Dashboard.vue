<script setup lang="ts">
import AppHeading from '../components/utils/AppHeading.vue'
</script>

<template>
  <section>
    <AppHeading title="Dashboard" size="md" />
    <p>Area administrativa em construcao.</p>
    <router-link to="/admin/logs">Ver Logs e Auditoria</router-link>
  </section>
</template>
