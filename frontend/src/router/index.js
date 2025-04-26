import Stiastics from '@/views/Statistics.vue'
import Tasks from '@/views/Tasks.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'tasks',
      component: Tasks,
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: Tasks,
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: Stiastics,
    },
  ],
})

export default router
