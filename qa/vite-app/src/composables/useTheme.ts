import { useColorMode } from "@vueuse/core";

/**
 * Dark-mode / theme handling via VueUse `useColorMode`.
 * Toggles the `.dark` class on <html> so shadcn-vue tokens switch.
 */
export function useTheme() {
  const mode = useColorMode({
    attribute: "class",
    modes: { light: "light", dark: "dark" },
  });

  function toggle() {
    mode.value = mode.value === "dark" ? "light" : "dark";
  }

  return { mode, toggle };
}
