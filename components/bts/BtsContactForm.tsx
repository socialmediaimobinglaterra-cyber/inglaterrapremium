"use client";

import { useRef, useState, type FormEvent } from "react";

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function BtsContactForm() {
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" });
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setState({ status: "idle", message: "" });

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/bts/contact", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message ?? "Não foi possível enviar sua mensagem.");
      }

      form.reset();
      setState({
        status: "success",
        message: data.message ?? "Mensagem enviada. Nossa equipe entrará em contato.",
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar sua mensagem agora.",
      });
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit} aria-busy={pending}>
      <fieldset disabled={pending} className="flex min-w-0 flex-col gap-3.5 border-0 p-0 [&_input]:min-w-0 [&_textarea]:min-w-0 [&_:focus-visible]:outline [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-terra-light">
      <legend className="sr-only">Contato Inglaterra BTS</legend>
      <select
        className="border border-white/20 bg-white/10 px-3.5 py-3 text-copy text-white outline-none"
        name="perfil"
        aria-label="Seu perfil"
        required
      >
        <option className="text-navy" value="">
          Selecione seu perfil
        </option>
        <option className="text-navy" value="Tenho um terreno">
          Tenho um terreno
        </option>
        <option className="text-navy" value="Preciso de um espaço sob medida">
          Preciso de um espaço sob medida
        </option>
      </select>
      <input
          className="border border-white/20 bg-white/10 px-3.5 py-3 text-copy text-white outline-none placeholder:text-white/75"
        name="nome"
        aria-label="Seu nome"
        autoComplete="name"
        placeholder="Seu nome"
        required
      />
      <input
          className="border border-white/20 bg-white/10 px-3.5 py-3 text-copy text-white outline-none placeholder:text-white/75"
        name="empresa"
        aria-label="Empresa"
        autoComplete="organization"
        placeholder="Empresa"
      />
      <input
          className="border border-white/20 bg-white/10 px-3.5 py-3 text-copy text-white outline-none placeholder:text-white/75"
        name="whatsapp"
        aria-label="WhatsApp"
        type="tel"
        autoComplete="tel"
        placeholder="WhatsApp"
        required
      />
      <input
          className="border border-white/20 bg-white/10 px-3.5 py-3 text-copy text-white outline-none placeholder:text-white/75"
        name="email"
        aria-label="E-mail"
        autoComplete="email"
        placeholder="E-mail"
        type="email"
      />
      <textarea
          className="min-h-24 border border-white/20 bg-white/10 px-3.5 py-3 text-copy text-white outline-none placeholder:text-white/75"
        name="mensagem"
        aria-label="Mensagem"
        placeholder="Conte brevemente sobre o terreno ou a operação"
      />
      <button
        className="mt-1 bg-terra p-3.5 text-caption uppercase tracking-[0.2em] text-white transition duration-200 hover:bg-terra-light disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Enviando" : "Enviar mensagem"}
      </button>
      </fieldset>
      {state.status !== "idle" ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`text-detail leading-relaxed ${
            state.status === "success" ? "text-terra-light" : "text-white/70"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
