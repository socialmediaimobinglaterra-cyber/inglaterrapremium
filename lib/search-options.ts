export const NEGOCIO_OPTIONS = ["Comprar", "Alugar"] as const;
export const VALOR_OPTIONS: { label: string; valorMinimo: number | null; valorMaximo: number | null }[] = [
  { label: "Não definido", valorMinimo: null, valorMaximo: null },
  { label: "Até R$ 2.000.000", valorMinimo: null, valorMaximo: 2_000_000 },
  { label: "Até R$ 4.000.000", valorMinimo: null, valorMaximo: 4_000_000 },
  { label: "Até R$ 6.000.000", valorMinimo: null, valorMaximo: 6_000_000 },
  { label: "Acima de R$ 6.000.000", valorMinimo: 6_000_000, valorMaximo: null },
];
