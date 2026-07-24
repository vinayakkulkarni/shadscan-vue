import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-24",
  devtools: { enabled: false },

  modules: ["shadcn-nuxt", "@nuxtjs/color-mode"],

  css: ["~/assets/css/tailwind.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
  },

  shadcn: {
    prefix: "",
    componentDir: "@/components/ui",
  },

  app: {
    head: {
      htmlAttrs: { lang: "en" },
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },
});
