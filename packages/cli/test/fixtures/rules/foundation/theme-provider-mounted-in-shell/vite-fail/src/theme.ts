import { useColorMode } from '@vueuse/core';

// Defined but never referenced from the app shell.
export const useTheme = (): ReturnType<typeof useColorMode> => useColorMode();
