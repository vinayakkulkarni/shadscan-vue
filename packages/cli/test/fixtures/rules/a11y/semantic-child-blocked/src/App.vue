<template>
  <ul>
    <li @click="open"><button type="button" @click.stop="remove">Remove</button></li>
    <li @click="open"><button type="button" @click="$event.stopPropagation()">Remove</button></li>
    <li @click="open"><ul @click.stop><button type="button">Remove</button></ul></li>
    <div @click.self="close"><button type="button">Inside</button></div>
    <div @click="open"><a>No href</a></div>
  </ul>
</template>
