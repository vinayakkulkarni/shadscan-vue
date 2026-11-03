<template>
  <ul>
    <li @click="open"><button type="button">Open</button></li>
    <div @click="go"><NuxtLink to="/a">A</NuxtLink></div>
    <div @click="select"><span>Row</span><Button @click="select">Select</Button></div>
  </ul>
</template>
