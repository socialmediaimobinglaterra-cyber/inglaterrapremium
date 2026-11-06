// Register this definition in the existing Studio's schemaTypes array.
export default {
  name: "homeBanner",
  title: "Banners da Home Premium",
  type: "document",
  fields: [
    { name: "titulo", title: "Nome interno", type: "string", validation: (rule) => rule.required() },
    { name: "imagem", title: "Imagem do banner", type: "image", validation: (rule) => rule.required(), description: "Use a mesma proporcao em todos os banners. A imagem sera exibida inteira, sem cortes." },
    { name: "textoAlternativo", title: "Descricao acessivel", type: "string", description: "Descreva a arte e inclua o texto principal da campanha.", validation: (rule) => rule.required() },
    { name: "link", title: "Destino ao clicar (opcional)", type: "url", validation: (rule) => rule.uri({ scheme: ["https"], allowRelative: true }) },
    { name: "ordem", title: "Ordem", type: "number", initialValue: 0, validation: (rule) => rule.required().integer().min(0) },
    { name: "ativo", title: "Exibir no site", type: "boolean", initialValue: false },
  ],
  orderings: [{ title: "Ordem de exibicao", name: "ordemAsc", by: [{ field: "ordem", direction: "asc" }] }],
  preview: { select: { title: "titulo", media: "imagem" } },
};
