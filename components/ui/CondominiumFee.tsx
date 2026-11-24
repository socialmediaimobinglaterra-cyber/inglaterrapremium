type Props = {
  value?: number | null;
  className?: string;
};

export function CondominiumFee({ value, className = "text-navy/70" }: Props) {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;

  return (
    <p className={`mt-1 text-[11px] font-normal leading-relaxed ${className}`}>
      Valor do condomínio: {value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
    </p>
  );
}
