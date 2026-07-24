<template>
  <form>
    <Label for="email">Email</Label>
    <Input id="email" type="email" autocomplete="email" />
    <label>Notes <textarea /></label>
    <input aria-label="Search" type="search" />
    <input type="hidden" name="csrf" />
  </form>
</template>
