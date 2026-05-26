export const PRODUCTS = [
  {
    id: 1, sku: "797H5NWDW", name: "Ashwagandha 500mg", slug: "ashwagandha-500mg",
    image: "https://cdn.awsli.com.br/300x300/2992/2992817/produto/400743857/df79914c5e0d4bc7b54b2466f18ff492-wmoxc20uc9.jpg",
    priceFrom: 27.0, priceTo: 26.0, discount: 4, installments: { count: 5, value: 5.2 },
    categories: ["Adaptógenos"], inStock: true,
    description: "Extrato de raiz de Ashwagandha 500mg por cápsula. Suporte ao equilíbrio hormonal e redução do estresse.",
    badge: "MAIS VENDIDO",
    rating: 4.8, reviewCount: 214,
  },
  {
    id: 2, sku: "FAD9EGZXV", name: "Vitamina ADEK New Four", slug: "vitamina-adek-new-four-60-capsulas",
    image: "https://cdn.awsli.com.br/300x300/2992/2992817/produto/400935660/ef13aa8db0be423583978b70f414b3a8-uawl6ukqka.jpg",
    priceFrom: 38.0, priceTo: 32.0, discount: 16, installments: { count: 6, value: 5.33 },
    categories: ["Vitaminas"], inStock: true,
    description: "Combinação das vitaminas lipossolúveis A, D, E e K em cápsulas de fácil absorção. 60 cápsulas.",
    badge: "OFERTA",
    rating: 4.6, reviewCount: 98,
  },
  {
    id: 3, sku: "MCG3X0001", name: "Magnésio Quelato 400mg", slug: "magnesio-quelato-400mg",
    image: "https://cdn.awsli.com.br/300x300/2992/2992817/produto/400743857/df79914c5e0d4bc7b54b2466f18ff492-wmoxc20uc9.jpg",
    priceFrom: 45.0, priceTo: 39.9, discount: 11, installments: { count: 6, value: 6.65 },
    categories: ["Minerais"], inStock: true,
    description: "Magnésio bisglicinato quelato de alta absorção. Ideal para relaxamento muscular e sono de qualidade.",
    badge: null,
    rating: 4.5, reviewCount: 61,
  },
  {
    id: 4, sku: "OMG3X0002", name: "Ômega 3 TG 1000mg", slug: "omega-3-tg-1000mg",
    image: "https://cdn.awsli.com.br/300x300/2992/2992817/produto/400935660/ef13aa8db0be423583978b70f414b3a8-uawl6ukqka.jpg",
    priceFrom: 55.0, priceTo: 47.9, discount: 13, installments: { count: 6, value: 7.98 },
    categories: ["Ácidos Graxos"], inStock: false,
    description: "Ômega 3 na forma de triglicerídeos. Alta concentração de EPA e DHA para saúde cardiovascular.",
    badge: "ESGOTADO",
    rating: 4.7, reviewCount: 133,
  },
];

export const CATEGORIES = ["Todos", ...Array.from(new Set(PRODUCTS.flatMap((p) => p.categories)))];
