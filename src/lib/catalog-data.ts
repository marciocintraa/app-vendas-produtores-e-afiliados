export type Product = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  platform: "Hotmart" | "Kiwify" | "Eduzz" | "Monetizze";
  rating: number;
  reviews: number;
  affiliateUrl: string;
  cover: string;
  highlights: string[];
  modules: { title: string; lessons: number }[];
};

const grad = (from: string, to: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='600' height='400' fill='url(%23g)'/><text x='50%' y='52%' font-family='Inter,sans-serif' font-size='34' font-weight='700' fill='white' text-anchor='middle'>${label}</text></svg>`,
  )}`;

export const PRODUCTS: Product[] = [
  {
    id: "renda-extra-digital",
    title: "Renda Extra Digital",
    tagline: "Do zero aos primeiros R$ 5k online",
    description:
      "Método passo a passo para criar sua primeira fonte de renda no digital, mesmo sem experiência. Aprenda a escolher nichos lucrativos, criar conteúdo e vender como afiliado.",
    price: 197,
    originalPrice: 497,
    category: "Marketing Digital",
    platform: "Hotmart",
    rating: 4.9,
    reviews: 1284,
    affiliateUrl: "https://hotmart.com/",
    cover: grad("#7c3aed", "#22d3ee", "Renda Extra Digital"),
    highlights: [
      "Acesso vitalício ao curso",
      "Comunidade privada no Telegram",
      "Certificado de conclusão",
      "Bônus: templates de anúncios",
    ],
    modules: [
      { title: "Fundamentos do digital", lessons: 8 },
      { title: "Escolha de nicho e produto", lessons: 6 },
      { title: "Tráfego orgânico e pago", lessons: 12 },
      { title: "Copy e conversão", lessons: 9 },
    ],
  },
  {
    id: "instagram-lucrativo",
    title: "Instagram Lucrativo",
    tagline: "Transforme seguidores em clientes",
    description:
      "Estratégia completa para monetizar o Instagram com afiliação, produtos digitais e serviços. Inclui roteiros de Reels prontos para copiar.",
    price: 147,
    originalPrice: 297,
    category: "Redes Sociais",
    platform: "Kiwify",
    rating: 4.8,
    reviews: 942,
    affiliateUrl: "https://kiwify.com.br/",
    cover: grad("#f472b6", "#8b5cf6", "Instagram Lucrativo"),
    highlights: [
      "50+ roteiros de Reels virais",
      "Planilha de calendário editorial",
      "Aulas ao vivo mensais",
    ],
    modules: [
      { title: "Perfil que converte", lessons: 5 },
      { title: "Reels que viralizam", lessons: 10 },
      { title: "Stories que vendem", lessons: 7 },
    ],
  },
  {
    id: "copy-que-vende",
    title: "Copy que Vende",
    tagline: "Escreva textos que geram vendas todos os dias",
    description:
      "Domine as fórmulas de copywriting usadas pelos maiores lançamentos do Brasil. Aprenda a escrever headlines, e-mails e páginas de vendas irresistíveis.",
    price: 297,
    category: "Copywriting",
    platform: "Eduzz",
    rating: 4.9,
    reviews: 613,
    affiliateUrl: "https://eduzz.com/",
    cover: grad("#22d3ee", "#0ea5e9", "Copy que Vende"),
    highlights: [
      "Swipe file com 200+ headlines",
      "Templates de e-mail prontos",
      "Análises de páginas reais",
    ],
    modules: [
      { title: "Fundamentos de copy", lessons: 6 },
      { title: "Headlines magnéticas", lessons: 5 },
      { title: "Páginas de venda", lessons: 8 },
      { title: "E-mail marketing", lessons: 7 },
    ],
  },
  {
    id: "trafego-pago-do-zero",
    title: "Tráfego Pago do Zero",
    tagline: "Meta Ads e Google Ads na prática",
    description:
      "Aprenda a criar campanhas lucrativas do zero, otimizar CPA e escalar resultados. Ideal para afiliados e produtores.",
    price: 397,
    originalPrice: 697,
    category: "Tráfego Pago",
    platform: "Hotmart",
    rating: 4.7,
    reviews: 458,
    affiliateUrl: "https://hotmart.com/",
    cover: grad("#f59e0b", "#ef4444", "Tráfego Pago do Zero"),
    highlights: [
      "Estruturas de campanha testadas",
      "Público-alvo pronto para copiar",
      "Suporte no grupo por 12 meses",
    ],
    modules: [
      { title: "Pixel e configuração", lessons: 4 },
      { title: "Meta Ads na prática", lessons: 11 },
      { title: "Google Ads na prática", lessons: 9 },
      { title: "Escala e otimização", lessons: 6 },
    ],
  },
  {
    id: "chatgpt-para-negocios",
    title: "ChatGPT para Negócios",
    tagline: "Automatize marketing e vendas com IA",
    description:
      "Use IA para criar conteúdo, atender clientes, gerar copy e escalar seu negócio digital sem contratar equipe.",
    price: 247,
    category: "Inteligência Artificial",
    platform: "Kiwify",
    rating: 4.9,
    reviews: 1120,
    affiliateUrl: "https://kiwify.com.br/",
    cover: grad("#10b981", "#22d3ee", "ChatGPT para Negocios"),
    highlights: [
      "100+ prompts prontos",
      "Automação de atendimento",
      "GPTs personalizados",
    ],
    modules: [
      { title: "Fundamentos de IA", lessons: 4 },
      { title: "Prompts para marketing", lessons: 8 },
      { title: "Automação de vendas", lessons: 6 },
    ],
  },
  {
    id: "dropshipping-nacional",
    title: "Dropshipping Nacional",
    tagline: "Loja lucrativa com fornecedores brasileiros",
    description:
      "Monte uma loja de dropshipping com entrega rápida usando fornecedores nacionais. Fuja das dores do AliExpress.",
    price: 497,
    originalPrice: 997,
    category: "E-commerce",
    platform: "Monetizze",
    rating: 4.6,
    reviews: 287,
    affiliateUrl: "https://monetizze.com.br/",
    cover: grad("#8b5cf6", "#ec4899", "Dropshipping Nacional"),
    highlights: [
      "Lista de 300+ fornecedores",
      "Templates de Shopify",
      "Estratégia de anúncios",
    ],
    modules: [
      { title: "Estrutura da loja", lessons: 7 },
      { title: "Escolha de produto", lessons: 5 },
      { title: "Anúncios lucrativos", lessons: 9 },
    ],
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export const CATEGORIES = Array.from(new Set(PRODUCTS.map((p) => p.category)));
