<template>
  <div>
    <button @click="open">Open</button>
    <div role="button" tabindex="0" @click="go" @keydown.enter="go">Go</div>
  </div>
</template>
