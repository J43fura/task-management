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
      <InputText
        type="text"
        v-model="task.creator"
        placeholder="Username"
        :disabled="connected"
        class="mb-2 mr-2"
      />
      <Button
        :label="connectionButton"
        :icon="!connected ? 'pi pi-sign-in' : 'pi pi-sign-out'"
        @click="toggleConnection()"
        :disabled="!task.creator"
      />
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
              <div class="flex flex-row text-surface-500">
                <div>
                  @{{ taskItem.creator }}
                  opened at
                  <li class="pi pi-calendar"></li>
                  {{ new Date(taskItem.date).toLocaleString() }}
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
              <i class="pi pi-check text-primary"></i>
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
import { computed, ref, nextTick, watch } from 'vue'
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
  fetchOptions: {
    mode: 'cors',
  },
})

const $toast = useToast()
const socket = io(backendUrl)
socket.disconnect()

const state = reactive({
  connected: false,
  tasks: [],
})
const tasks = computed(() => state.tasks)
const connected = computed(() => state.connected)

async function toggleConnection() {
  if (!connected.value) {
    socket.connect()
    const { data } = await backendFetch('tasks').get().json()
    state.tasks.push(...data.value)
  } else {
    socket.disconnect()
  }
}
const connectionButton = computed(() => (!connected.value ? 'Connect' : 'Disconnect'))
const connectionColor = computed(() => (!connected.value ? 'amber' : 'sky'))

const task = ref({ content: '' })
const connected_users = ref(0)

function addTask(taskItem) {
  socket.emit('new-task', taskItem)
}
function removeTask(taskItem) {
  socket.emit('remove-task', taskItem)
}
function editTask(taskItem) {
  socket.emit('update-task', taskItem)
}
function finishTask(taskItem) {
  taskItem.is_finished = true
  socket.emit('update-task', taskItem)
}
function toggleTask(taskItem) {
  taskItem.assigned_to = taskItem.assigned_to ? null : task.value.creator
  socket.emit('update-task', taskItem)
}

// Socket event handlers (emitted from backend)
socket.on('connect', () => {
  state.connected = true
})
socket.on('disconnect', () => {
  state.connected = false
})
socket.on('connected-users', (new_connected_users) => {
  connected_users.value = new_connected_users
})

socket.on('new-task', (task) => {
  state.tasks.push(task)
  $toast.add({ severity: 'info', summary: 'Task', detail: 'Recieved new task', life: 3000 })
})
socket.on('remove-task', (task) => {
  state.tasks = state.tasks.filter((filterTask) => filterTask._id !== task._id)
  $toast.add({ severity: 'warn', summary: 'Task', detail: 'Removed task', life: 3000 })
})
socket.on('update-task', (task) => {
  state.tasks = state.tasks.map((oldTask) => (oldTask._id !== task._id ? oldTask : task))
  $toast.add({ severity: 'info', summary: 'Task', detail: 'Updated task', life: 3000 })
})
</script>
