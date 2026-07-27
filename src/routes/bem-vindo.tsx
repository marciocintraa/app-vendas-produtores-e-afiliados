import { createFileRoute, redirect } from "@tanstack/react-router";

// Rota de compatibilidade: a Hotmart pode ter botões antigos apontando
// para /bem-vindo. Redirecionamos direto para /acesso preservando o email.
export const Route = createFileRoute("/bem-vindo")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/acesso",
      search: search.email ? { email: search.email } : {},
    });
  },
});
