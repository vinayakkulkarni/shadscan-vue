import { useMagicKeys } from "@vueuse/core";

export function useCommandPalette() {
  const isOpen = useState("palette-open", () => false);
  const { meta_k, ctrl_k } = useMagicKeys();

  watch([meta_k, ctrl_k], ([mk, ck]) => {
    if (mk || ck) isOpen.value = !isOpen.value;
  });

  return { isOpen };
}
