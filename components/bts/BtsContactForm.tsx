"use client";

import { useState, type FormEvent } from "react";

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function BtsContactForm() {
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" });
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
      <select
        className="border border-white/20 bg-white/10 px-3.5 py-3 text-[13px] text-white outline-none"
        name="perfil"
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
        className="border border-white/20 bg-white/10 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-white/40"
        name="nome"
        placeholder="Seu nome"
        required
      />
      <input
        className="border border-white/20 bg-white/10 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-white/40"
        name="empresa"
        placeholder="Empresa"
      />
      <input
        className="border border-white/20 bg-white/10 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-white/40"
        name="whatsapp"
        placeholder="WhatsApp"
        required
      />
      <input
        className="border border-white/20 bg-white/10 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-white/40"
        name="email"
        placeholder="E-mail"
        type="email"
      />
      <textarea
        className="min-h-24 border border-white/20 bg-white/10 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-white/40"
        name="mensagem"
        placeholder="Conte brevemente sobre o terreno ou a operação"
      />
      <button
        className="mt-1 bg-terra p-3.5 text-[10px] uppercase tracking-[0.2em] text-white transition duration-200 hover:bg-terra-light disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Enviando" : "Enviar mensagem"}
      </button>
      {state.status !== "idle" ? (
        <p
          className={`text-[12px] leading-relaxed ${
            state.status === "success" ? "text-terra-light" : "text-white/70"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
