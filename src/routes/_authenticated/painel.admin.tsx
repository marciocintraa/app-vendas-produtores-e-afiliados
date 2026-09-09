import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { listAccounts } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/painel/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Administração — Vende Fácil Pro" },
      { name: "description", content: "Painel de administração do Vende Fácil Pro: contas, planos, catálogos e produtos." },
      { property: "og:title", content: "Administração — Vende Fácil Pro" },
      { property: "og:description", content: "Painel de administração do Vende Fácil Pro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function AdminPage() {
  const fetchAccounts = useServerFn(listAccounts);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "accounts"],
    queryFn: () => fetchAccounts(),
  });

  return (
    <div className="min-h-screen bg-[#070B18] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Link>

        <header className="mt-5 flex items-center gap-3">
          <span className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-300"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <h1 className="text-2xl font-bold">Administração</h1>
            <p className="text-sm text-slate-400">Todas as contas do aplicativo, com plano, catálogos e produtos.</p>
          </div>
        </header>

        {isLoading && (
          <div className="mt-16 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-cyan-400" /></div>
        )}

        {error && (
          <p className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300">
            Não foi possível carregar as contas. Verifique se sua conta tem a função de administrador.
          </p>
        )}

        {data && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-[#0A0F22] p-5">
                <p className="text-sm text-slate-400">Contas</p>
                <p className="mt-2 text-3xl font-bold">{data.length}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#0A0F22] p-5">
                <p className="text-sm text-slate-400">Com acesso PRO</p>
                <p className="mt-2 text-3xl font-bold">{data.filter((a) => a.plan === "pro").length}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#0A0F22] p-5">
                <p className="text-sm text-slate-400">Produtos cadastrados</p>
                <p className="mt-2 text-3xl font-bold">{data.reduce((n, a) => n + a.products, 0)}</p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/5 bg-[#0A0F22]">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-white/5 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Conta</th>
                    <th className="px-5 py-3">Plano</th>
                    <th className="px-5 py-3">Catálogos</th>
                    <th className="px-5 py-3">Produtos</th>
                    <th className="px-5 py-3">Último acesso</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((a) => (
                    <tr key={a.userId} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-3">
                        <span className="font-medium">{a.email}</span>
                        {a.isAdmin && (
                          <span className="ml-2 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[11px] font-bold text-cyan-300">ADMIN</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={a.plan === "pro" ? "font-semibold text-emerald-300" : "text-slate-400"}>
                          {a.plan === "pro" ? "PRO" : "Grátis"}
                        </span>
                      </td>
                      <td className="px-5 py-3">{a.catalogs}</td>
                      <td className="px-5 py-3">{a.products}</td>
                      <td className="px-5 py-3 text-slate-400">{formatDate(a.lastSignInAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
