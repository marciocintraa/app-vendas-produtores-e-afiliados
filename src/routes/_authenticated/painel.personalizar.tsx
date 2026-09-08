import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Palette, Save } from "lucide-react";
import { toast } from "sonner";
import { useBrand, saveBrand, DEFAULT_BRAND, type Brand } from "@/lib/app-extras-store";

export const Route = createFileRoute("/_authenticated/painel/personalizar")({
  head: () => ({
    meta: [
      { title: "Personalizar Vitrine — Vende Fácil Pro" },
      { name: "description", content: "Coloque sua marca, cores e contatos na vitrine do seu catálogo." },
      { property: "og:title", content: "Personalizar Vitrine — Vende Fácil Pro" },
      { property: "og:description", content: "Deixe o catálogo com a sua cara: nome, logo, cor e contatos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PersonalizarPage,
});

function PersonalizarPage() {
  const brand = useBrand();
  const [form, setForm] = useState<Brand>(DEFAULT_BRAND);

  useEffect(() => {
    setForm(brand);
  }, [brand]);

  const field = (key: keyof Brand, label: string, placeholder = "") => (
    <label className="block">
      <span className="mb-1 block text-sm text-muted-foreground">{label}</span>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <Palette className="h-7 w-7 text-primary" /> Personalizar Vitrine
      </h1>
      <p className="mt-2 text-muted-foreground">Deixe o catálogo com a sua identidade antes de divulgar.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveBrand(form);
            toast.success("Personalização salva.");
          }}
          className="space-y-4 rounded-2xl border border-border/50 bg-card p-5"
        >
          {field("storeName", "Nome da sua loja", "Ex.: Loja do Márcio")}
          {field("tagline", "Frase de apresentação")}
          {field("logoUrl", "Link da sua logo (opcional)", "https://...")}
          {field("whatsapp", "WhatsApp para contato", "(11) 99999-0000")}
          {field("instagram", "Instagram", "@seuperfil")}
          <label className="block">
            <span className="mb-1 block text-sm text-muted-foreground">Cor principal</span>
            <input
              type="color"
              value={form.accent}
              onChange={(e) => setForm({ ...form, accent: e.target.value })}
              className="h-10 w-20 cursor-pointer rounded-lg border border-border/50 bg-background"
            />
          </label>
          {field("footerNote", "Recado no rodapé do catálogo")}
          <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground">
            <Save className="h-4 w-4" /> Salvar personalização
          </button>
        </form>

        <div className="h-fit rounded-2xl border border-border/50 bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Prévia</p>
          <div className="mt-3 rounded-xl border border-border/40 p-4" style={{ borderTopColor: form.accent, borderTopWidth: 4 }}>
            {form.logoUrl ? (
              <img src={form.logoUrl} alt={form.storeName} className="mb-3 h-12 w-auto object-contain" />
            ) : null}
            <p className="text-lg font-bold" style={{ color: form.accent }}>
              {form.storeName || "Meu Catálogo"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{form.tagline}</p>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              {form.whatsapp && <p>WhatsApp: {form.whatsapp}</p>}
              {form.instagram && <p>Instagram: {form.instagram}</p>}
              {form.footerNote && <p className="pt-2">{form.footerNote}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
