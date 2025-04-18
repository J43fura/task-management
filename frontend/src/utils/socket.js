import { useToast } from 'primevue/usetoast'
import { io } from 'socket.io-client'
import { reactive } from 'vue'

const $toast = useToast()

export const state = reactive({
  connected: false,
  tasks: [],
})

const BACKEND_URL = 'http://localhost:3000'

export const socket = io(BACKEND_URL)

// Socket event handlers (emitted from backend)
socket.on('connect', () => {
  state.connected = true
})
socket.on('disconnect', () => {
  state.connected = false
})
socket.on('new-task', (task) => {
  state.tasks.push(task)
  $toast.add({ severity: 'info', summary: 'Task', detail: 'Recieved new task' })
})

export function addTask(task) {
  socket.emit('new-task', task)
}
