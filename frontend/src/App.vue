<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Login</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>
