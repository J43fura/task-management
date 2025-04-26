<template>
  <div class="card flex justify-center">
    <Chart type="pie" :data="chartData" :options="chartOptions" class="w-full md:w-[30rem]" />
  </div>
</template>

<script setup>
import Chart from 'primevue/chart'
import { createFetch } from '@vueuse/core'
import { ref, onMounted, computed } from 'vue'

onMounted(() => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/tasks'
  }
})
const backendUrl = 'http://localhost:3000'

const backendFetch = createFetch({
  baseUrl: backendUrl,
  fetchOptions: {
    mode: 'cors',
  },
})

const chartData = ref()
const chartOptions = ref()
const tasks = ref([])
const taskCount = computed(() => tasks.value.length)
const finishedTaskCount = computed(() => tasks.value?.filter((task) => task.is_finished).length)
const ongoingTaskCount = computed(() => tasks.value?.filter((task) => task.assigned_to).length)

const unfinishedTaskCount = computed(
  () => taskCount.value - finishedTaskCount.value - ongoingTaskCount.value,
)
const finishedTaskPercentage = computed(() => (finishedTaskCount / taskCount) * 100)
onMounted(async () => {
  const { data } = await backendFetch('tasks').get().json()
  tasks.value = data.value
  chartData.value = setChartData()
  chartOptions.value = setChartOptions()
})
const setChartData = () => {
  return {
    labels: ['Finished tasks', 'Ongoing tasks', 'Unfinished tasks'],
    datasets: [
      {
        label: 'Finished tasks',
        data: [finishedTaskCount.value, ongoingTaskCount.value, unfinishedTaskCount.value],
      },
    ],
  }
}
const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement)
  const textColor = documentStyle.getPropertyValue('--p-text-color')
  const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color')
  const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color')

  return {
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
        },
      },
    },
  }
}
</script>
