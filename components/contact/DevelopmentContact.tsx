export function DevelopmentContact({ nome }: { nome: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <p className="break-words text-[13px] leading-relaxed text-white">{nome}</p>
      <a
        className="mt-1 flex min-h-11 items-center justify-center bg-terra p-3.5 text-center text-[10px] uppercase tracking-[0.2em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terra-light"
        href="https://link.imobiliariainglaterra.com.br/p/imobiliaria-inglaterra"
        target="_blank"
        rel="noopener noreferrer"
      >
        Falar pelo WhatsApp
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
    </div>
  );
}
