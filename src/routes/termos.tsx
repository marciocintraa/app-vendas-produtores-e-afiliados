import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso | Vende Fácil PRO" },
      { name: "description", content: "Termos de uso da plataforma Vende Fácil PRO." },
      { property: "og:title", content: "Termos de Uso | Vende Fácil PRO" },
      { property: "og:description", content: "Termos de uso da plataforma Vende Fácil PRO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://vendefacillapp.com.br/termos" }],
  }),
  component: Termos,
});

function Termos() {
  return (
    <main className="container-page py-16">
      <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar
      </a>
      <h1 className="mt-6 font-display text-3xl font-bold">Termos de Uso</h1>
      <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Ao utilizar o Vende Fácil PRO, você concorda em usar a plataforma para organizar seus
          próprios produtos, catálogos e links de divulgação, respeitando a legislação vigente e as
          regras das plataformas de pagamento que você utiliza.
        </p>
        <p>
          O acesso completo é concedido mediante pagamento único, processado pela Hotmart. O acesso
          é pessoal e não deve ser compartilhado com terceiros.
        </p>
        <p>
          Você é responsável pelo conteúdo que cadastra na plataforma, incluindo textos, imagens,
          preços e links de venda ou de afiliado.
        </p>
        <p>
          Podemos atualizar estes termos para refletir melhorias e novos recursos da plataforma.
        </p>
        <p>
          Dúvidas: <a className="text-accent" href="mailto:contato@vendefacillapp.com.br">contato@vendefacillapp.com.br</a>
        </p>
      </div>
    </main>
  );
}
