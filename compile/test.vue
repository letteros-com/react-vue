<template>
  <div @click="increase">{{count}}</div>
</template>

<script>
  export default {
    name: 'Two',
    data () {
      return {
        count: 0
      }
    },
    method: {
      increase () {
        this.count ++;
      }
    }
  }
</script>
