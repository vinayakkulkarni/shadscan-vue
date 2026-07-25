import type { PageSeoInput } from '~/types/seo';

export const usePageSeo = (input: PageSeoInput): void => {
  const { public: config } = useRuntimeConfig();
  const route = useRoute();

  const siteUrl = config.siteUrl.replace(/\/$/, '');
  const canonical = `${siteUrl}${route.path === '/' ? '' : route.path}`;
  const image = `${siteUrl}/og/${input.ogSlug ?? 'default'}.png`;

  useSeoMeta({
    title: input.title,
    description: input.description,
    ogTitle: input.ogTitle ?? input.title,
    ogDescription: input.ogDescription ?? input.description,
    ogUrl: canonical,
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: input.ogTitle ?? input.title,
    twitterTitle: input.ogTitle ?? input.title,
    twitterDescription: input.ogDescription ?? input.description,
    twitterImage: image,
    twitterImageAlt: input.ogTitle ?? input.title,
  });

  useHead({
    link: [{ rel: 'canonical', href: canonical }],
  });
};
