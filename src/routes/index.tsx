import { createFileRoute } from "@tanstack/react-router";
import { HOTMART_CHECKOUT_URLS, type PlanId } from "@/lib/hotmart";
import {
  Sparkles,
  Store,
  Zap,
  BarChart3,
  Bell,
  Palette,
  Bot,
  Search,
  Link2,
  Check,
  ArrowRight,
  Smartphone,
  Monitor,
  Rocket,
  ShieldCheck,
  Users,
  HelpCircle,
  ChevronDown,
  Quote,
  Lock,

} from "lucide-react";
import { useState } from "react";
import heroImg from "@/assets/hero-app.jpg";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vende Fácil Pro — App Android para Produtos Digitais" },
      {
        name: "description",
        content:
          "Transforme seu catálogo de infoprodutos em um app profissional para Android com o Vende Fácil Pro. Ideal para produtores, afiliados e criadores da Hotmart, Kiwify, Eduzz e mais.",
      },
      { property: "og:title", content: "Vende Fácil Pro — App Android para Produtos Digitais" },
      {
        property: "og:description",
        content:
          "Transforme seu catálogo de infoprodutos em um app profissional para Android com o Vende Fácil Pro. Ideal para produtores, afiliados e criadores da Hotmart, Kiwify, Eduzz e mais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <Audience />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border">
      <div className="container-page flex items-center justify-between h-16">
        <a href="#top" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-2 text-primary-foreground">
            <Store className="w-4 h-4" strokeWidth={2.5} />
          </span>
          Vende Fácil <span className="text-gradient">Pro</span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a>
          <a href="#publico" className="hover:text-foreground transition-colors">Para quem</a>
          <a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a>
          <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <a href="#planos" className="hidden lg:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Lock className="w-4 h-4" />
          Assinar para baixar
        </a>
        <a href="#planos" className="btn-primary text-sm !py-2.5 !px-4">
          Começar agora
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="container-page pt-20 pb-24 md:pt-28 md:pb-32 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            App Android para Produtos Digitais
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-[1.05]">
            Seu catálogo de infoprodutos em um app profissional com o{" "}
            <span className="text-gradient">Vende Fácil Pro</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Produtores e afiliados agora têm seu próprio app de vendas. Concentre todos
            os seus produtos da Hotmart, Kiwify, Eduzz e outras plataformas em um único aplicativo
            — com IA, analytics e notificações push para converter mais.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-4 max-w-xl">
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Você escolhe como usar após a compra
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-background/60 border border-border p-3">
                <div className="flex items-center gap-2 text-accent mb-1">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Android</span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  Baixe o APK e instale no celular ou tablet.
                </p>
              </div>
              <div className="rounded-xl bg-background/60 border border-border p-3">
                <div className="flex items-center gap-2 text-accent mb-1">
                  <Monitor className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Web</span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  Use pelo navegador em qualquer dispositivo.
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              A escolha é feita depois do pagamento confirmado, sem custo extra. Use a opção que for melhor para você.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#planos" className="btn-primary">
              Começar agora <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#recursos" className="btn-ghost">
              Ver recursos
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" /> Pagamento na Hotmart
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-accent" /> Android
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-accent" /> Web
            </div>
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute inset-0 -z-10 blur-3xl opacity-60"
            style={{
              background:
                "radial-gradient(circle at 60% 40%, oklch(0.72 0.2 295 / 0.55), transparent 60%)",
            }}
          />
          <div className="card-glass p-3 rotate-1">
            <img
              src={heroImg}
              alt="Preview do aplicativo Vende Fácil Pro em um smartphone"
              width={1600}
              height={1200}
              className="rounded-xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  const items = [
    "Hotmart", "Kiwify", "Eduzz", "Monetizze", "PerfectPay", "Kirvano",
  ];
  return (
    <section className="border-y border-border bg-surface/40">
      <div className="container-page py-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mr-4">
          Compatível com
        </p>
        {items.map((n) => (
          <span key={n} className="text-sm font-semibold text-muted-foreground/80">
            {n}
          </span>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: Palette,
      title: "White label completo",
      text: "Nome, logotipo, cores, fontes e domínio próprio. Sua marca em primeiro plano.",
    },
    {
      icon: Bot,
      title: "IA de marketing integrada",
      text: "Escreva descrições, headlines, anúncios e e-mails com uma IA especialista em conversão.",
    },
    {
      icon: BarChart3,
      title: "Analytics de conversão",
      text: "Cliques, CTR, produtos mais acessados, origem de tráfego e receita estimada.",
    },
    {
      icon: Bell,
      title: "Notificações push",
      text: "Avise sobre lançamentos, cupons e ofertas relâmpago direto na tela dos seus clientes.",
    },
    {
      icon: Link2,
      title: "Links de qualquer plataforma",
      text: "Cadastre botões de compra apontando para Hotmart, Kiwify, Eduzz, Shopify ou checkout próprio.",
    },
    {
      icon: Search,
      title: "Busca inteligente",
      text: "Categorias, tags, autores, palavras-chave, recomendados e produtos em destaque.",
    },
  ];

  return (
    <section id="recursos" className="py-24">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-accent font-semibold">
            Recursos
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Uma ferramenta de vendas, não só um catálogo.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Cada recurso foi desenhado para aumentar conversões, fidelizar clientes e escalar a
            receita recorrente do seu negócio digital.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card-glass p-6 transition-transform hover:-translate-y-1">
              <div className="grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-brand/25 to-brand-2/20 border border-border">
                <f.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Audience() {
  const groups = [
    "Afiliados", "Produtores", "Infoprodutores", "Agências",
    "Influenciadores", "Mentores", "Coaches", "Consultores",
    "Criadores de conteúdo", "Especialistas", "Empresas digitais", "Comunidades",
  ];
  return (
    <section id="publico" className="py-24 bg-surface/30 border-y border-border">
      <div className="container-page grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-accent font-semibold">
            Para quem
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Feito para quem vive de <span className="text-gradient">produto digital</span>.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Se você vende cursos, mentorias, ebooks, comunidades ou qualquer produto digital, o
            Vende Fácil Pro concentra sua audiência em um único app com a sua marca.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-muted-foreground">+12 nichos atendidos</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {groups.map((g) => (
            <div key={g} className="card-glass px-4 py-3 text-sm font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-accent shrink-0" />
              {g}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    {
      name: "Ana Paula Ribeiro",
      role: "Produtora de cursos",
      initials: "AR",
      quote:
        "Consegui centralizar todos os meus cursos em um único app. Meus alunos acham profissional e minhas conversões aumentaram desde o primeiro mês.",
      metric: "+34% de conversão",
    },
    {
      name: "Bruno Costa",
      role: "Afiliado Hotmart",
      initials: "BC",
      quote:
        "Antes eu mandava vários links diferentes. Agora envio um único catálogo com todos os produtos e acompanho quem clicou no que.",
      metric: "3x mais cliques",
    },
    {
      name: "Camila Mendes",
      role: "Mentora e criadora de conteúdo",
      initials: "CM",
      quote:
        "A IA de marketing me economiza horas toda semana. Escrevo descrições e anúncios em minutos, com a minha voz de marca.",
      metric: "6h economizadas/semana",
    },
  ];

  return (
    <section id="depoimentos" className="py-24">
      <div className="container-page">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs uppercase tracking-widest text-accent font-semibold">
            Depoimentos
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Quem usa, <span className="text-gradient">recomenda</span>.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Produtores, afiliados e criadores que transformaram seus catálogos em apps de vendas.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="card-glass p-6 flex flex-col transition-transform hover:-translate-y-1"
            >
              <Quote className="w-8 h-8 text-accent/60" aria-hidden="true" />
              <blockquote className="mt-4 text-foreground/90 leading-relaxed flex-1">
                “{t.quote}”
              </blockquote>
              <div className="mt-6 pt-6 border-t border-border flex items-center gap-4">
                <span
                  className="grid place-items-center w-11 h-11 rounded-full bg-gradient-to-br from-brand/25 to-brand-2/20 border border-border text-sm font-bold text-accent"
                  aria-hidden="true"
                >
                  {t.initials}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{t.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{t.role}</p>
                </div>
                <span className="hidden sm:inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                  {t.metric}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 opacity-70">
          {["Hotmart", "Kiwify", "Eduzz", "Monetizze", "PerfectPay", "Kirvano"].map((brand) => (
            <span
              key={brand}
              className="text-sm font-semibold text-muted-foreground/80 tracking-tight"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Individual",
      price: "R$ 37",
      per: "/mês",
      desc: "Para começar a vender com um catálogo enxuto.",
      features: [
        "Até 2 produtos",

        "Categorias básicas",
        "Tema padrão",
        "Estatísticas básicas",
      ],
      cta: "Assinar Individual",
      priceId: "starter_monthly" as PlanId,
      highlight: false,
    },
    {
      name: "Familiar",
      price: "R$ 57",
      per: "/mês",
      desc: "Para produtores em crescimento que querem escalar.",
      features: [
        "Até 5 produtos",
        "Categorias ilimitadas",
        "Personalização visual",
        "Notificações push",
        "Estatísticas completas",
      ],
      cta: "Assinar Familiar",
      priceId: "pro_monthly" as PlanId,
      highlight: true,
    },
    {
      name: "Premium",
      price: "R$ 97",
      per: "/mês",
      desc: "Para operações profissionais com marca própria.",
      features: [
        "Produtos ilimitados",
        "IA completa",
        "Tema e domínio personalizados",
        "Analytics avançado",
        "Exportação de dados",
        "Suporte prioritário",
      ],
      cta: "Assinar Premium",
      priceId: "premium_monthly" as PlanId,
      highlight: false,
    },
  ];

  return (
    <section id="planos" className="py-24">
      <div className="container-page">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs uppercase tracking-widest text-accent font-semibold">
            Planos
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Assinatura simples, app Android liberado.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Escolha o plano que acompanha o crescimento do seu catálogo. Pagamento e entrega são
            feitos pela Hotmart — após a aprovação, você recebe por e-mail o link do .apk para
            instalar no Android.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`card-glass p-8 relative ${
                p.highlight ? "ring-2 ring-brand/60 shadow-[var(--shadow-glow)]" : ""
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-brand to-brand-2 text-primary-foreground">
                  Mais popular
                </span>
              )}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold font-display">{p.price}</span>
                <span className="text-muted-foreground text-sm">{p.per}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={HOTMART_CHECKOUT_URLS[p.priceId]}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 w-full inline-flex items-center justify-center gap-2 ${p.highlight ? "btn-primary" : "btn-ghost"}`}
              >
                {p.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Pagamento seguro pela Hotmart · Cartão · PIX · Boleto
        </p>
      </div>
    </section>
  );
}



function FAQ() {
  const [open, setOpen] = useState<string[]>(["planos"]);

  const toggle = (id: string) => {
    setOpen((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const items = [
    {
      id: "planos",
      question: "Quantos produtos posso cadastrar em cada plano?",
      answer:
        "O plano Individual permite até 2 produtos, o Familiar até 5 produtos, e o Premium é ilimitado. Você pode trocar de plano a qualquer momento conforme seu catálogo cresce.",
    },
    {
      id: "produtos",
      question: "Que tipo de produto digital posso vender no app?",
      answer:
        "Cursos, ebooks, mentorias, comunidades, planilhas, templates, áudios, podcasts e qualquer produto digital que tenha um link de checkout ou página de vendas. Basta cadastrar o título, descrição, imagem e link de compra.",
    },
    {
      id: "compartilhar",
      question: "Como meus clientes acessam o catálogo?",
      answer:
        "Você instala o Vende Fácil Pro no Android e compartilha seu catálogo pelo WhatsApp, Instagram, TikTok, e-mail ou bio. Seus clientes veem seus produtos direto no app.",
    },
    {
      id: "plataformas",
      question: "Funciona com Hotmart, Kiwify, Eduzz e outras plataformas?",
      answer:
        "Sim. Você cola o link de afiliado ou de produtor de qualquer plataforma — Hotmart, Kiwify, Eduzz, Monetizze, PerfectPay, Kirvano, Shopify, Stripe e outras. A venda final acontece na plataforma escolhida.",
    },
    {
      id: "android",
      question: "O app funciona apenas no Android?",
      answer:
        "Sim. O Vende Fácil Pro é entregue como um arquivo .apk para Android. Após a compra aprovada, você recebe o link de download e instala no celular em poucos toques.",
    },
    {
      id: "personalizacao",
      question: "Posso personalizar cores, logo e domínio?",
      answer:
        "Sim. Nos planos Familiar e Premium você pode alterar cores, tipografia, logotipo e ícone. No Premium também é possível usar domínio próprio e configurações white label completas.",
    },
    {
      id: "cancelamento",
      question: "Posso cancelar a assinatura a qualquer momento?",
      answer:
        "Sim. A assinatura é mensal e pode ser cancelada quando você quiser, sem taxas extras. Você mantém o acesso até o final do período já pago.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-surface/30 border-y border-border">
      <div className="container-page max-w-3xl">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
            <HelpCircle className="w-3.5 h-3.5 text-accent" />
            Dúvidas frequentes
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold">
            Tudo o que você precisa saber
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Respostas rápidas sobre planos, produtos digitais e como compartilhar seu catálogo.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const isOpen = open.includes(item.id);
            return (
              <div
                key={item.id}
                className={`card-glass overflow-hidden transition-all ${
                  isOpen ? "ring-1 ring-brand/30" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded-xl"
                >
                  <span className="font-semibold text-foreground">{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-accent shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={`faq-answer-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-question-${item.id}`}
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24">
      <div className="container-page">
        <div className="card-glass p-10 md:p-16 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10 opacity-70"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, oklch(0.72 0.2 295 / 0.35), transparent 60%)",
            }}
          />
          <Rocket className="w-10 h-10 mx-auto text-accent" />
          <h2 className="mt-4 text-3xl md:text-5xl font-bold max-w-2xl mx-auto">
            Tenha seu <span className="text-gradient">app de vendas</span> no Android.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Sem código. Sem loja. Sua marca, seus produtos, seus clientes instalando direto no Android.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#planos" className="btn-primary">
              Começar agora <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#recursos" className="btn-ghost">
              <Zap className="w-4 h-4" /> Ver recursos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="container-page flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-6 h-6 rounded-md bg-gradient-to-br from-brand to-brand-2">
            <Store className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <span>© {new Date().getFullYear()} Vende Fácil Pro</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground">Termos</a>
          <a href="#" className="hover:text-foreground">Privacidade</a>
          <a href="#" className="hover:text-foreground">Contato</a>
        </div>
      </div>
    </footer>
  );
}
