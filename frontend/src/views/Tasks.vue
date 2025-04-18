<template>
  <Card class="text-center">
    <template #title>Task manager</template>
    <template #content>
      <Card>
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
            v-model="task.username"
            placeholder="Username"
            :disabled="connected"
          />
          <br />
          <Button
            :label="connectionButton"
            @click="toggleConnection()"
            :disabled="!task.username"
          />
          <p>Connected: {{ connected }}</p>
          <p v-if="connected">{{ connected_users }} <i class="pi pi-user"></i></p>
        </template>
      </Card>

      <Panel v-if="connected" header="Tasks">
        <ul>
          <li>
            <InputText type="text" v-model="task.content" />
            <Button label="Add task" icon="pi pi-plus" @click="addTask(task)" />
            <Divider />
          </li>
          <li v-for="task in tasks" :key="task.index">
            {{ task.index }}
            {{ task.content }}
            @{{ task.username }}
            <Button label="Edit" @click="editTask(task)" severity="secondary" icon="pi pi-pencil" />

            <Button
              :label="task.status === 'default' ? 'Start' : 'Drop'"
              @click="toggleTask(task)"
              :icon="`pi pi-${task.status === 'default' ? 'play' : 'times'}`"
            />
            <Button
              label="Finish"
              @click="finishTask(task)"
              severity="success"
              icon="pi pi-check"
            />
            <Button label="Delete" severity="danger" @click="removeTask(task)" icon="pi pi-trash" />

            <Divider />
          </li>
        </ul>
      </Panel>
    </template>
  </Card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { io } from 'socket.io-client'
import { reactive } from 'vue'

const $toast = useToast()
const socket = io('http://localhost:3000')
socket.disconnect()

const state = reactive({
  connected: false,
  tasks: [],
})

const connected = computed(() => state.connected)
function toggleConnection() {
  if (!connected.value) {
    socket.connect()
  } else {
    socket.disconnect()
  }
}
const connectionButton = computed(() => (!connected.value ? 'Connect' : 'Disconnect'))
const connectionColor = computed(() => (!connected.value ? 'amber' : 'sky'))
const tasks = computed(() => state.tasks)

const task = ref({ content: '' })
const connected_users = ref(0)

const example_task = {
  content: 'Content',
  created_by: 'Username',
  assigned_by: 'Username2',
}
function addTask(task) {
  socket.emit('new-task', task)
}
function removeTask(task) {
  socket.emit('remove-task', task)
}
function editTask(task) {
  socket.emit('edit-task', task)
}
function toggleTask(task) {
  socket.emit('update-task', task)
}

// Socket event handlers (emitted from backend)
socket.on('connect', () => {
  state.connected = true
})
socket.on('disconnect', () => {
  state.connected = false
})
socket.on('connected-users', (new_connected_users) => {
  console.log(new_connected_users)
  connected_users.value = new_connected_users
})

socket.on('new-task', (task) => {
  state.tasks.push(task)
  $toast.add({ severity: 'info', summary: 'Task', detail: 'Recieved new task', life: 3000 })
})
socket.on('remove-task', (task) => {
  state.tasks = state.tasks.filter((filterTask) => filterTask.index !== task.index)
  $toast.add({ severity: 'warn', summary: 'Task', detail: 'Removed task', life: 3000 })
})
socket.on('update-task', (task) => {
  state.tasks = state.tasks.map((oldTask) => (oldTask.index !== task.index ? oldTask : task))
  $toast.add({ severity: 'info', summary: 'Task', detail: 'Updated task', life: 3000 })
})
</script>
