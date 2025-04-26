<template>
  <Card class="text-center">
    <template #title>
      <div class="flex justify-center">
        Connection
        <span class="relative flex size-3" v-tooltip="`Connected: ${connected}`">
          <span
            :class="`absolute inline-flex h-full w-full animate-ping rounded-full bg-${connectionColor}-400 opacity-75`"
          ></span>
          <span
            :class="`relative inline-flex size-3 rounded-full bg-${connectionColor}-500`"
          ></span>
        </span>
      </div>
    </template>
    <template #content>
      <div>
        <InputText
          type="text"
          v-model="username"
          placeholder="Username"
          :disabled="connected"
          class="mb-2 mr-2"
        />
        <InputText
          type="password"
          v-model="password"
          placeholder="Password"
          :disabled="connected"
          class="mb-2 mr-2"
        />
        <Button
          :label="connectionButton"
          :icon="!connected ? 'pi pi-sign-in' : 'pi pi-sign-out'"
          @click="handleAuth()"
          :disabled="!connected && (!username || !password)"
        />
      </div>
      <p>Connected: {{ connected }}</p>
      <p v-if="connected">{{ connected_users }} <i class="pi pi-user"></i></p>
      <p v-else><i class="pi pi-exclamation-triangle" /></p>

      <Panel v-if="connected" class="mt-4 overflow-auto" header="Tasks">
        <InputText class="mr-2" type="text" v-model="task.content" />
        <Button label="Add task" icon="pi pi-plus" @click="addTask(task)" />
        <Divider />

        <ul class="mt-4 overflow-auto h-[55vh]">
          <li v-for="taskItem in tasks" :key="taskItem._id">
            <div class="flex flex-col">
              <div class="mb-2">
                <InputText
                  v-if="!(taskItem.is_finished || task.creator !== taskItem.creator)"
                  class="mr-2"
                  type="text"
                  v-model="taskItem.content"
                />
                <div v-else>
                  {{ taskItem.content }}
                </div>
              </div>
              <div class="flex flex-row text-surface-500 text-sm">
                <div>
                  @{{ taskItem.creator }}
                  opened at
                  <li class="pi pi-calendar"></li>
                  {{ new Date(taskItem.createdAt).toLocaleString() }}
                </div>

                <div v-if="taskItem.assigned_to">
                  , Assigned to
                  <span class="font-medium text-gray-950">@{{ taskItem.assigned_to }}</span>
                </div>

                <Button
                  class="ml-auto"
                  v-tooltip.top="'More information'"
                  type="button"
                  @click="displayTask($event, taskItem)"
                  icon="pi pi-info-circle"
                  severity="secondary"
                  rounded
                  size="small"
                ></Button>
              </div>
            </div>

            <div v-if="!taskItem.is_finished" class="flex justify-center">
              <Button
                v-if="!(taskItem.is_finished || task.creator !== taskItem.creator)"
                :disabled="
                  taskItem.is_finished || task.creator !== taskItem.creator || taskItem.assigned_to
                "
                label="Edit"
                @click="editTask(taskItem)"
                severity="secondary"
                icon="pi pi-pencil"
              />

              <Button
                v-if="!(taskItem.assigned_to !== null && taskItem.assigned_to !== task.creator)"
                :disabled="
                  (taskItem.assigned_to !== null && taskItem.assigned_to !== task.creator) ||
                  taskItem.is_finished
                "
                :label="!taskItem.assigned_to ? 'Start' : 'Drop'"
                @click="toggleTask(taskItem)"
                :icon="`pi pi-${!taskItem.assigned_to ? 'play' : 'times'}`"
              />
              <Button
                v-if="!(taskItem.assigned_to !== task.creator || taskItem.is_finished)"
                label="Finish"
                @click="finishTask(taskItem)"
                severity="success"
                icon="pi pi-check"
              />
              <Button
                v-if="task.creator === taskItem.creator"
                label="Delete"
                severity="danger"
                @click="removeTask(taskItem)"
                icon="pi pi-trash"
              />
            </div>
            <div v-else>
              <i class="pi pi-check text-primary text-2xl mb-2"></i>
              <div class="text-surface-500 text-sm">
                Finished at
                <li class="pi pi-calendar"></li>
                {{ new Date(taskItem.updatedAt).toLocaleString() }}
              </div>
            </div>

            <Divider />
          </li>
        </ul>
      </Panel>
    </template>
  </Card>

  <Popover ref="op">
    <div v-if="selectedTask" class="rounded flex flex-col">
      <ul>
        <li v-for="(item, key) in selectedTask">{{ key }}: {{ item }}</li>
      </ul>
    </div>
  </Popover>
</template>

<script setup>
import { computed, ref, nextTick, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { io } from 'socket.io-client'
import { reactive } from 'vue'
import { createFetch } from '@vueuse/core'

const op = ref()
const selectedTask = ref(null)
function displayTask(event, taskItem) {
  op.value.hide()

  if (selectedTask.value?._id === taskItem._id) {
    selectedTask.value = null
  } else {
    selectedTask.value = taskItem
    nextTick(() => {
      op.value.show(event)
    })
  }
}

const backendUrl = 'http://localhost:3000'
const backendFetch = createFetch({
  baseUrl: backendUrl,
  options: {
    async beforeFetch({ options }) {
      const token = localStorage.getItem('token')
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        }
      }
      return { options }
    },
  },
  fetchOptions: {
    mode: 'cors',
  },
})

const $toast = useToast()
const socket = ref(null)

const state = reactive({
  connected: false,
  tasks: [],
})
const tasks = computed(() => state.tasks)
const connected = ref(false)

const username = ref('')
const password = ref('')

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    connected.value = false
  } else {
    connected.value = true
    connectSocket()
    await getTasks()
  }
})

async function handleAuth() {
  if (connected.value) {
    handleLogout()
    return
  }
  try {
    const response = await backendFetch('auth').post({
      username: username.value,
      password: password.value,
    })
    const responseData = JSON.parse(response.data.value)

    localStorage.setItem('token', responseData.token)
    localStorage.setItem('username', responseData.user.username)
    connected.value = true
    connectSocket()
    await getTasks()

    $toast.add({
      severity: 'success',
      summary: 'Welcome',
      detail: 'Successfully signed in',
      life: 3000,
    })
  } catch (error) {
    console.error('Error during auth:', error)
  }
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  connected.value = false
  state.tasks.value = []
  socket.value.disconnect()
  socket.value = null
}

async function getTasks() {
  const { data } = await backendFetch('tasks').get().json()
  state.tasks = data.value
}

const connectionButton = computed(() => (!connected.value ? 'Connect' : 'Disconnect'))
const connectionColor = computed(() => (!connected.value ? 'amber' : 'sky'))

const task = ref({ content: '', creator: '' })
const connected_users = ref(0)

function addTask(taskItem) {
  socket.value.emit('new-task', taskItem)
}
function removeTask(taskItem) {
  socket.value.emit('remove-task', taskItem)
}
function editTask(taskItem) {
  socket.value.emit('update-task', taskItem)
}
function finishTask(taskItem) {
  taskItem.is_finished = true
  socket.value.emit('update-task', taskItem)
}
function toggleTask(taskItem) {
  taskItem.assigned_to = taskItem.assigned_to ? null : task.value.creator
  socket.value.emit('update-task', taskItem)
}

function connectSocket() {
  const token = localStorage.getItem('token')
  username.value = localStorage.getItem('username')

  task.value.creator = username.value

  socket.value = io(backendUrl, {
    auth: { token },
  })
  socket.value.connect()
  // Socket event handlers (emitted from backend)
  socket.value.on('connect', () => {
    state.connected = true
  })
  socket.value.on('disconnect', () => {
    state.connected = false
  })
  socket.value.on('connected-users', (new_connected_users) => {
    connected_users.value = new_connected_users
  })

  socket.value.on('new-task', (task) => {
    state.tasks.push(task)
    $toast.add({ severity: 'info', summary: 'Task', detail: 'Recieved new task', life: 3000 })
  })
  socket.value.on('remove-task', (task) => {
    console.log('Removed task', task._id, state.tasks)

    state.tasks = state.tasks.filter((filterTask) => filterTask._id !== task._id)
    console.log('Removed task', state.tasks)
    $toast.add({ severity: 'warn', summary: 'Task', detail: 'Removed task', life: 3000 })
  })
  socket.value.on('update-task', (task) => {
    state.tasks = state.tasks.map((oldTask) => (oldTask._id !== task._id ? oldTask : task))
    $toast.add({ severity: 'info', summary: 'Task', detail: 'Updated task', life: 3000 })
  })
}
</script>
