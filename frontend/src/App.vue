<template>
  <Menubar :model="items">
    <template #item="{ item, props }">
      <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
        <a v-ripple :href="href" v-bind="props.action" @click="navigate">
          <span :class="item.icon" />
          <span>{{ item.label }}</span>
        </a>
      </router-link>
    </template>
    <template #end> TaskManager </template>
  </Menubar>
  <body>
    <RouterView />
  </body>
  <Toast />
</template>

<script setup>
import { RouterView } from 'vue-router'

import { ref } from 'vue'

const items = ref([
  {
    label: 'Home',
    icon: 'pi pi-home',
    route: '/tasks',
  },
  {
    label: 'Statistics',
    icon: 'pi pi-chart-pie',
    route: '/statistics',
  },
])
</script>
