import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Papre",
    short_name: "Papre",
    description: "Create, organize, and share notes, pages, and folders.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    lang: "en",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Home",
        short_name: "Home",
        description: "Open your pages and folders.",
        url: "/home",
        icons: [
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "any",
            type: "image/x-icon",
          },
        ],
      },
      {
        name: "Calendar",
        short_name: "Calendar",
        description: "Open your calendar pages.",
        url: "/calendar",
        icons: [
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "any",
            type: "image/x-icon",
          },
        ],
      },
    ],
  };
}
