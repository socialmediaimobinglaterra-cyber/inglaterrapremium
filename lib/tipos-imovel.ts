// Tipos de imóvel que o CRM grava no Sanity (campo `type`, em código minúsculo sem acento).
// O Sanity antigo (Gaia) usa "sala", "salao", "predio" e "studio"; o CRM usa "sala_comercial",
// "salao_comercial", "predio_comercial" e "estudio". Cada GRUPO abaixo reúne os dois jeitos, para o
// site mostrar um rótulo só e o filtro achar o imóvel de qualquer origem. Tipo que o CRM criar e não
// estiver aqui continua funcionando: o rótulo sai do próprio código e o filtro casa só com ele.
const GRUPOS: Array<{ rotulo: string; codigos: string[] }> = [
  { rotulo: "Apartamento", codigos: ["apartamento"] },
  { rotulo: "Apartamento Duplex", codigos: ["apartamento_duplex", "duplex"] },
  { rotulo: "Casa", codigos: ["casa"] },
  { rotulo: "Sobrado", codigos: ["sobrado"] },
  { rotulo: "Cobertura", codigos: ["cobertura"] },
  { rotulo: "Studio", codigos: ["studio", "estudio"] },
  { rotulo: "Kitnet", codigos: ["kitnet"] },
  { rotulo: "Flat", codigos: ["flat"] },
  { rotulo: "Loft", codigos: ["loft"] },
  { rotulo: "Conjunto", codigos: ["conjunto"] },
  { rotulo: "Terreno", codigos: ["terreno"] },
  { rotulo: "Chácara", codigos: ["chacara"] },
  { rotulo: "Sítio", codigos: ["sitio"] },
  { rotulo: "Fazenda", codigos: ["fazenda"] },
  { rotulo: "Área", codigos: ["area"] },
  { rotulo: "Sala", codigos: ["sala", "sala_comercial"] },
  { rotulo: "Salão", codigos: ["salao", "salao_comercial"] },
  { rotulo: "Loja", codigos: ["loja"] },
  { rotulo: "Ponto Comercial", codigos: ["ponto"] },
  { rotulo: "Prédio", codigos: ["predio", "predio_comercial"] },
  { rotulo: "Galpão", codigos: ["galpao"] },
  { rotulo: "Barracão", codigos: ["barracao"] },
  { rotulo: "Edícula", codigos: ["edicula"] },
  { rotulo: "Hotel", codigos: ["hotel"] },
  { rotulo: "Comercial", codigos: ["comercial"] },
  { rotulo: "Outro", codigos: ["outro"] },
];

function norm(valor: string | null | undefined) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s_-]+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

const PORCHAVE = new Map<string, (typeof GRUPOS)[number]>();
for (const g of GRUPOS) {
  PORCHAVE.set(norm(g.rotulo), g);
  for (const c of g.codigos) PORCHAVE.set(norm(c), g);
}

/** Rótulo para a tela: "sala_comercial" → "Sala", "fazenda" → "Fazenda", "edicula" → "Edícula". */
export function tipoRotulo(tipo: string | null | undefined): string {
  const g = PORCHAVE.get(norm(tipo));
  if (g) return g.rotulo;
  const texto = (tipo ?? "").replace(/[_-]+/g, " ").trim();
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "Imóvel";
}

/** Códigos gravados no Sanity que o filtro precisa aceitar. Serve para rótulo ("Sala") e para código ("sala_comercial"). */
export function codigosDoTipo(valor: string | null | undefined): string[] {
  const g = PORCHAVE.get(norm(valor));
  if (g) return g.codigos;
  const bruto = (valor ?? "").trim();
  return bruto ? [bruto, bruto.toLocaleLowerCase("pt-BR")] : [];
}
