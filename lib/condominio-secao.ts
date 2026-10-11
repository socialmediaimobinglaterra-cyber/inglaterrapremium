/**
 * Seção "O condomínio" (página do imóvel + página do condomínio).
 *
 * Tudo isto fica DESLIGADO em produção até a variável `CONDOMINIO_SECAO=on`
 * estar definida no projeto Vercel. Desligado, o site se comporta exatamente
 * como antes. Motivo: os condomínios ainda não foram carregados pelo CRM e os
 * 500 documentos de hoje só têm nome/endereço/comodidades — mostrar isso agora
 * daria uma seção pobre em ~1.200 imóveis.
 */
export function condominioSecaoAtiva(): boolean {
  return process.env.CONDOMINIO_SECAO === "on";
}

// O menu, a lista de condomínios premium e o endereço (slug) das páginas são do site (lib/premium-condominios.ts).
// Aqui só ficam a chave de liga/desliga e o que a seção "O condomínio" precisa.

/** Rótulos do vocabulário de comodidades (mesmos `value` do Studio). O catálogo do Sanity, se existir, tem prioridade. */
export const ROTULOS_COMODIDADES: Record<string, string> = {
  piscina: "Piscina", piscina_infantil: "Piscina infantil", piscina_termica: "Piscina térmica", churrasqueira: "Churrasqueira",
  academia: "Academia", sauna: "Sauna", hidromassagem: "Hidromassagem", salao_festas: "Salão de festas", salao_jogos: "Salão de jogos",
  playground: "Playground", quadra_poliesportiva: "Quadra poliesportiva", quadra_tenis: "Quadra de tênis", beach_tennis: "Quadra de beach tênis",
  campo_futebol: "Campo de futebol", pista_caminhada: "Pista de caminhada", ciclovia: "Ciclovia / ciclofaixa", area_lazer: "Área de lazer",
  area_verde: "Área verde", espaco_gourmet: "Espaço gourmet", brinquedoteca: "Brinquedoteca", coworking: "Coworking", cinema: "Cinema",
  bicicletario: "Bicicletário", pet_place: "Pet place", solarium: "Solário", car_wash: "Car wash", mini_mercado: "Mini mercado",
  estacionamento_visitante: "Estacionamento para visitante", sacada: "Sacada / varanda", varanda_gourmet: "Varanda gourmet",
  cozinha_americana: "Cozinha americana", andar_alto: "Andar alto", vista_livre: "Vista livre", terraco: "Terraço", quintal: "Quintal",
  lavabo: "Lavabo", area_servico: "Área de serviço", copa: "Copa", despensa: "Despensa", escritorio: "Escritório", closet: "Closet",
  deposito: "Depósito", mezanino: "Mezanino", jardim_inverno: "Jardim de inverno", lareira: "Lareira", adega: "Adega",
  pe_direito_duplo: "Pé-direito duplo", dormitorio_reversivel: "Dormitório reversível", dormitorio_empregada: "Dormitório de empregada",
  wc_empregada: "WC de empregada", vestiario: "Vestiário", ar_condicionado: "Ar-condicionado", elevador: "Elevador", interfone: "Interfone",
  portao_eletronico: "Portão eletrônico", alarme: "Alarme", cftv: "Câmeras (CFTV)", portaria_24h: "Portaria 24h", seguranca_24h: "Segurança 24h",
  zelador: "Zelador", tv_cabo: "TV a cabo", energia_solar: "Energia solar", garagem_coberta: "Garagem coberta", condominio_fechado: "Condomínio fechado",
  acessibilidade_pne: "Acessibilidade PNE", armarios_planejados: "Armários planejados", cozinha_servico: "Cozinha com área de serviço",
  mobiliado: "Mobiliado", semimobiliado: "Semimobiliado", aceita_pet: "Aceita pet", frente_mar: "Frente mar", beira_mar: "Beira mar",
  agua: "Água", gas_encanado: "Gás encanado", esgoto: "Esgoto", energia_eletrica: "Energia elétrica", rua_asfaltada: "Rua asfaltada",
  entrada_caminhoes: "Entrada para caminhões", doca: "Doca", vao_livre: "Vão livre", caseiro: "Casa de caseiro",
};

export type ItemCatalogo = { value: string; label: string; categoria?: string | null; escopo?: string | null };

/** Rótulo de uma comodidade: catálogo do Sanity > rótulos embutidos > slug formatado (nunca quebra). */
export function rotuloComodidade(slug: string, catalogo?: Map<string, ItemCatalogo>): string {
  const doCatalogo = catalogo?.get(slug)?.label?.trim();
  if (doCatalogo) return doCatalogo;
  if (ROTULOS_COMODIDADES[slug]) return ROTULOS_COMODIDADES[slug];
  const texto = slug.replace(/[_-]+/g, " ").trim();
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : slug;
}

/** Agrupa por categoria do catálogo; sem categoria vira um grupo único sem título. Preserva a ordem de entrada. */
export function agruparComodidades(slugs: string[], catalogo?: Map<string, ItemCatalogo>): Array<{ titulo: string | null; itens: string[] }> {
  const unicos = [...new Set(slugs.filter(Boolean))];
  const grupos = new Map<string | null, string[]>();
  for (const slug of unicos) {
    const categoria = catalogo?.get(slug)?.categoria?.trim() || null;
    grupos.set(categoria, [...(grupos.get(categoria) ?? []), rotuloComodidade(slug, catalogo)]);
  }
  const comTitulo = [...grupos.entries()].filter(([t]) => t !== null) as Array<[string, string[]]>;
  const semTitulo = grupos.get(null);
  return [...comTitulo.map(([titulo, itens]) => ({ titulo, itens })), ...(semTitulo ? [{ titulo: null, itens: semTitulo }] : [])];
}

/** Comodidades que são só da unidade: tudo que NÃO está nas do condomínio (property.amenities é a união). */
export function comodidadesDaUnidade(amenities: string[] | null | undefined, doCondominio: string[] | null | undefined): string[] {
  const condo = new Set(doCondominio ?? []);
  return (amenities ?? []).filter((slug) => slug && !condo.has(slug));
}

/** `YYYY-MM` -> "mar/2027". Qualquer outra coisa volta como veio (não quebra a página). */
export function formatarPrevisaoEntrega(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const m = valor.match(/^(\d{4})-(\d{2})$/);
  if (!m) return valor;
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const mes = Number(m[2]);
  return mes >= 1 && mes <= 12 ? `${meses[mes - 1]}/${m[1]}` : valor;
}
