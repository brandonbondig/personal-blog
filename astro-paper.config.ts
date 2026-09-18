import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://bondig.dev/",
    title: "Bondig Software",
    header: "Bondig.dev",
    description: "My personal blog about web development and programming.",
    author: "Brandon Bondig",
    profile: "https://bondig.dev/about/",
    ogImage: "astropaper-og.jpg",
    lang: "en",
    timezone: "UTC",
    dir: "ltr",
  },
  posts: {
    perPage: 5,
    perIndex: 4,
    scheduledPostMargin: 2 * 60 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: false,
    showBackButton: true,
    editPost: { enabled: false },
    search: "pagefind",
  },
  socials: [
    {
      name: "github",
      url: "https://github.com/brandonbondig",
      linkTitle: "Bondig Software on Github",
    },
    {
      name: "instagram",
      url: "https://www.instagram.com/brandonbondig/",
      linkTitle: "Bondig Software on Instagram",
    },
    {
      name: "linkedin",
      url: "https://www.linkedin.com/in/brandonbondig/",
      linkTitle: "Bondig Software on LinkedIn",
    },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
