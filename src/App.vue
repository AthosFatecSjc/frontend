<script setup lang="ts"></script>

<template>
  <v-app>
    <nav style="margin-bottom: 1rem">
      <router-link to="/indicadores">Indicadores</router-link>
      <router-link to="/signup">Sign Up</router-link>
    </nav>
    <router-view />
  </v-app>
</template>
