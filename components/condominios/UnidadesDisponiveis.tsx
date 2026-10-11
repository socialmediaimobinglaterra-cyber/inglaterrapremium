import type { Unidade } from "@/lib/queries/imoveis";

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Lançamento: só as unidades disponíveis. Preço 0 já vem como null (sem valor). Sem unidade disponível, não aparece. */
export function UnidadesDisponiveis({ unidades }: { unidades: Unidade[] }) {
  const disponiveis = unidades.filter((u) => u.disponivel);
  if (disponiveis.length === 0) return null;
  const menor = disponiveis.map((u) => u.preco).filter((p): p is number => p !== null).sort((a, b) => a - b)[0];

  return (
    <section aria-label="Unidades disponíveis" className="site-container pt-10 md:pt-14">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">Unidades disponíveis</h2>
      {menor !== undefined ? <p className="mb-4 text-[13px] text-navy">A partir de {moeda(menor)}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse bg-white text-left text-[13px] text-navy">
          <thead>
            <tr className="border-b border-navy/10 text-[10px] uppercase tracking-[0.1em]">
              <th className="px-4 py-3 font-semibold">Unidade</th>
              <th className="px-4 py-3 font-semibold">Área</th>
              <th className="px-4 py-3 font-semibold">Dormitórios</th>
              <th className="px-4 py-3 font-semibold">Vagas</th>
              <th className="px-4 py-3 text-right font-semibold">Valor</th>
            </tr>
          </thead>
          <tbody>
            {disponiveis.map((u) => (
              <tr className="border-b border-navy/10 last:border-0" key={u.key}>
                <td className="px-4 py-3 font-medium">{u.numero}</td>
                <td className="px-4 py-3">{u.area !== null ? `${u.area.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m²` : "—"}</td>
                <td className="px-4 py-3">
                  {u.dormitorios !== null ? u.dormitorios : "—"}
                  {u.suites ? ` (${u.suites} ${u.suites === 1 ? "suíte" : "suítes"})` : ""}
                </td>
                <td className="px-4 py-3">{u.vagas !== null ? u.vagas : "—"}</td>
                <td className="px-4 py-3 text-right font-medium">{u.preco !== null ? moeda(u.preco) : "Consulte"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
