<script setup lang="ts">
import { ref } from "vue";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const email = ref("");
const nickname = ref("");
const timezone = ref("");

function onSubmit() {
  toast("Settings saved");
}
</script>

<template>
  <section class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Settings</h1>
      <p class="text-sm text-muted-foreground">Mixed good and bad form patterns for QA.</p>
    </div>

    <form class="space-y-6" @submit.prevent="onSubmit">
      <!-- QA:satisfies:forms-have-labels + personal-data autocomplete -->
      <div class="space-y-2">
        <Label for="email">Email address</Label>
        <Input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
        />
      </div>

      <!-- QA:violation:forms-have-labels (Input with NO associated Label) -->
      <div class="space-y-2">
        <Input v-model="nickname" placeholder="Nickname (no label)" />
      </div>

      <!-- QA:satisfies:labeled Select with grouped items -->
      <div class="space-y-2">
        <Label for="timezone">Timezone</Label>
        <Select v-model="timezone">
          <SelectTrigger id="timezone" class="w-full">
            <SelectValue placeholder="Select a timezone" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Asia</SelectLabel>
              <SelectItem value="ist">India (IST)</SelectItem>
              <SelectItem value="jst">Japan (JST)</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>America</SelectLabel>
              <SelectItem value="est">Eastern (EST)</SelectItem>
              <SelectItem value="pst">Pacific (PST)</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div class="flex gap-3">
        <!-- QA:satisfies:form-buttons-have-explicit-type -->
        <Button type="submit">Save changes</Button>

        <!-- QA:violation:form-buttons-have-explicit-type (button in form, no type) -->
        <Button variant="outline">Reset</Button>
      </div>
    </form>
  </section>
</template>
