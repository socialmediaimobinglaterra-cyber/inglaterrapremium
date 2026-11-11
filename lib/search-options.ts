export const NEGOCIO_OPTIONS = ["Comprar", "Alugar"] as const;
export const VALOR_OPTIONS: { label: string; valorMinimo: number | null; valorMaximo: number | null }[] = [
  { label: "Não definido", valorMinimo: null, valorMaximo: null },
  { label: "Até R$ 2.000.000", valorMinimo: null, valorMaximo: 2_000_000 },
  { label: "Até R$ 4.000.000", valorMinimo: null, valorMaximo: 4_000_000 },
  { label: "Até R$ 6.000.000", valorMinimo: null, valorMaximo: 6_000_000 },
  { label: "Acima de R$ 6.000.000", valorMinimo: 6_000_000, valorMaximo: null },
];

const RENTAL_VALUE_OPTIONS: typeof VALOR_OPTIONS = [
  { label: "Não definido", valorMinimo: null, valorMaximo: null },
  { label: "Até R$ 5.000/mês", valorMinimo: null, valorMaximo: 5_000 },
  { label: "Até R$ 8.000/mês", valorMinimo: null, valorMaximo: 8_000 },
  { label: "Até R$ 12.000/mês", valorMinimo: null, valorMaximo: 12_000 },
  { label: "Até R$ 20.000/mês", valorMinimo: null, valorMaximo: 20_000 },
  { label: "Acima de R$ 20.000/mês", valorMinimo: 20_000, valorMaximo: null },
];

export function getValorOptions(negocio: string) {
  return negocio === "Alugar" ? RENTAL_VALUE_OPTIONS : VALOR_OPTIONS;
}
