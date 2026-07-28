import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [
      { title: "Vende Fácil Pro" },
      { name: "description", content: "Acesse o Vende Fácil Pro." },
      { property: "og:title", content: "Vende Fácil Pro" },
      { property: "og:description", content: "Acesse o Vende Fácil Pro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => null,
});
