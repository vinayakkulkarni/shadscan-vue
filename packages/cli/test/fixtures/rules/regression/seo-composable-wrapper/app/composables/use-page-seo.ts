export function usePageSeo(options: { title: string; description: string }) {
  useHead(() => ({ title: options.title, meta: [{ name: "description", content: options.description }] }));
}
