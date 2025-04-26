import Login from '@/views/Login.vue'
import Tasks from '@/views/Tasks.vue'
import Stiastics from '@/views/Statistics.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login,
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
