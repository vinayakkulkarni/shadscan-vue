<template>
  <form>
    <Label for="timezone">Timezone</Label>
    <Select v-model="timezone">
      <SelectTrigger id="timezone">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Asia</SelectLabel>
          <SelectItem value="ist">IST</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </form>
</template>
