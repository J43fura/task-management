import Login from '@/views/Login.vue'
import Tasks from '@/views/Tasks.vue'
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
  ],
})

export default router
