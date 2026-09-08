import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import MeuCatalogoScreen from "@/components/MeuCatalogoScreen";

export const Route = createFileRoute("/app/catalogo")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/acesso" });
  },
  head: () => ({
    meta: [
      { title: "Meu Catálogo — Vende Fácil Pro" },
      {
        name: "description",
        content:
          "Compartilhe o link público do seu catálogo, gere o QR Code e acompanhe seus produtos publicados.",
      },
      { property: "og:title", content: "Meu Catálogo — Vende Fácil Pro" },
      {
        property: "og:description",
        content: "Link público, QR Code e compartilhamento do seu catálogo de produtos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MeuCatalogoScreen,
});
