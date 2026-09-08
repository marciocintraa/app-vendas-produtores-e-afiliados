import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Home,
  Package,
  Store,
  Sparkles,
  Users,
  ShoppingCart,
  Wallet,
  BarChart3,
  BookOpen,
  Link2,
  Bell,
  Palette,
  Crown,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/painel", label: "Início", icon: Home },
  { to: "/painel/produtos", label: "Produtos", icon: Package },
  { to: "/painel/catalogo", label: "Meu Catálogo", icon: Store },
  { to: "/painel/personalizar", label: "Personalizar", icon: Palette },
  { to: "/painel/ia", label: "IA VENDE+", icon: Sparkles },
  { to: "/painel/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/painel/links", label: "Links", icon: Link2 },
  { to: "/painel/notificacoes", label: "Avisos", icon: Bell },
  { to: "/painel/clientes", label: "Clientes", icon: Users },
  { to: "/painel/vendas", label: "Vendas", icon: ShoppingCart },
  { to: "/painel/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/painel/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/painel/plano", label: "Meu Plano", icon: Crown },
] as const;

export default function PainelShell({ email, children }: { email?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const menu = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          activeOptions={{ exact: to === "/painel" }}
          activeProps={{ className: "bg-primary/15 text-foreground border-primary/40" }}
          className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Topo mobile */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 lg:hidden">
        <span className="font-bold">Vende Fácil Pro</span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-border/50 p-2"
          aria-label="Abrir menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && <div className="border-b border-border/50 p-4 lg:hidden">{menu}</div>}

      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/50 bg-card/40 p-4 lg:flex">
          <div className="px-2 pb-6">
            <p className="text-lg font-bold">Vende Fácil Pro</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{email}</p>
          </div>
          {menu}
          <button
            onClick={signOut}
            className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
