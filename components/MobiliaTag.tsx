/**
 * Selo "Mobiliado" (destaque, fundo navy) / "Semimobiliado" (discreto, contorno).
 * Quem usa decide a posição (no card da busca fica sobre a foto).
 */
export type Mobilia = "Mobiliado" | "Semimobiliado";

export default function MobiliaTag({ mobilia }: { mobilia: Mobilia | null | undefined }) {
  if (!mobilia) return null;
  const cheio = mobilia === "Mobiliado";
  return (
    <span
      className={`inline-block whitespace-nowrap border px-2.5 py-[5px] text-[8px] uppercase tracking-[0.3em] ${
        cheio ? "border-navy bg-navy text-white" : "border-navy/40 bg-white text-navy"
      }`}
    >
      {mobilia}
    </span>
  );
}
