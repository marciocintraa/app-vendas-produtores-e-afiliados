import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade | Vende Fácil PRO" },
      { name: "description", content: "Como o Vende Fácil PRO trata os seus dados." },
      { property: "og:title", content: "Política de Privacidade | Vende Fácil PRO" },
      { property: "og:description", content: "Como o Vende Fácil PRO trata os seus dados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://vendefacillapp.com.br/privacidade" }],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <main className="container-page py-16">
      <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar
      </a>
      <h1 className="mt-6 font-display text-3xl font-bold">Política de Privacidade</h1>
      <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Coletamos apenas os dados necessários para o funcionamento da plataforma: e-mail de
          acesso e as informações que você cadastra sobre seus produtos e catálogos.
        </p>
        <p>
          Os dados de pagamento são tratados pela Hotmart. Não armazenamos dados de cartão.
        </p>
        <p>
          Seus produtos e catálogos ficam vinculados à sua conta. Catálogos publicados ficam
          acessíveis publicamente por meio do link que você compartilha.
        </p>
        <p>
          Para solicitar exclusão dos seus dados, escreva para{" "}
          <a className="text-accent" href="mailto:contato@vendefacillapp.com.br">contato@vendefacillapp.com.br</a>.
        </p>
      </div>
    </main>
  );
}
