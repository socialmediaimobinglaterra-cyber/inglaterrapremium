import type { Metadata } from "next";
import { requestCodeAction, verifyCodeAction } from "./actions";

export const metadata: Metadata = {
  title: "Login Admin | Inglaterra Premium",
};

type PageProps = {
  searchParams: Promise<{
    email?: string;
    sent?: string;
    erro?: string;
  }>;
};

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-sand">
        {label}
      </span>
      <input
        className="w-full border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none transition focus:border-terra"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
    </label>
  );
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = params.email ?? "";
  const codeStep = params.sent === "1" && email;

  return (
    <main className="site-container min-h-screen bg-offwhite py-24 text-navy">
      <section className="mx-auto max-w-md border border-navy/10 bg-white p-6 shadow-[0_18px_60px_rgba(16,26,38,0.08)] md:p-8">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-terra">
          Admin Inglaterra Premium
        </p>
        <h1 className="mb-3 text-2xl font-light tracking-[0.02em]">
          Acesso por código
        </h1>
        <p className="mb-7 text-sm leading-relaxed text-sand">
          Entre com um e-mail cadastrado. Enviaremos um código de 6 dígitos com
          validade de 10 minutos.
        </p>

        {params.erro === "email" ? (
          <p className="mb-4 border border-terra/20 bg-terra/5 px-3 py-2 text-xs text-terra">
            Informe um e-mail válido.
          </p>
        ) : null}

        {params.erro === "codigo" ? (
          <p className="mb-4 border border-terra/20 bg-terra/5 px-3 py-2 text-xs text-terra">
            Código inválido ou expirado. Solicite um novo código se necessário.
          </p>
        ) : null}

        {params.erro === "envio" ? (
          <p className="mb-4 border border-terra/20 bg-terra/5 px-3 py-2 text-xs text-terra">
            Não foi possível enviar o código agora. Confira a configuração do
            Resend e tente novamente.
          </p>
        ) : null}

        {!codeStep ? (
          <form action={requestCodeAction} className="flex flex-col gap-5">
            <Field
              label="E-mail"
              name="email"
              placeholder="voce@imobiliariainglaterra.com.br"
              type="email"
            />
            <button
              className="bg-terra px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#6b2a0f]"
              type="submit"
            >
              Enviar código
            </button>
          </form>
        ) : (
          <form action={verifyCodeAction} className="flex flex-col gap-5">
            <input name="email" type="hidden" value={email} />
            <div className="border border-navy/10 bg-offwhite px-4 py-3 text-xs leading-relaxed text-sand">
              Código enviado para <span className="text-navy">{email}</span>,
              caso este e-mail esteja cadastrado no Admin.
            </div>
            <Field
              label="Código"
              name="code"
              placeholder="000000"
              type="text"
            />
            <button
              className="bg-terra px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#6b2a0f]"
              type="submit"
            >
              Entrar
            </button>
            <a
              className="text-center text-xs text-sand underline-offset-4 hover:text-terra hover:underline"
              href="/admin/login"
            >
              Usar outro e-mail
            </a>
          </form>
        )}
      </section>
    </main>
  );
}
