"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { contactSettings } from "@/lib/contact-settings";
import { BLOG_URL } from "@/lib/blog-posts";
import { PRIVACY_POLICY_PATH } from "@/lib/privacy-policy";

const extraLinks = [
  { label: "Trabalhe conosco", href: contactSettings.careers },
  { label: "Anuncie seu imóvel", href: contactSettings.appraisal },
  { label: "Notícias", href: BLOG_URL },
  { label: "Newsletter", href: "/#newsletter" },
  { label: "Política de privacidade", href: PRIVACY_POLICY_PATH },
];

export type NavDropdownItem = {
  label: string;
  href: string;
};

type NavItem = {
  label: string;
  href?: string;
  basePath?: string;
  dropdown?: NavDropdownItem[];
};

function getNavItems(
  lancamentos: NavDropdownItem[],
  condominios: NavDropdownItem[]
): NavItem[] {
  return [
    { label: "Comprar", href: "/imoveis" },
    { label: "Alugar", href: "/imoveis/alugar" },
    { label: "Lançamentos", basePath: "/lancamentos", dropdown: lancamentos },
    { label: "Condomínios", dropdown: condominios },
    { label: "BTS", href: "/bts" },
    { label: "Sobre", href: "/sobre" },
  ];
}

function isActive(pathname: string, item: NavItem) {
  if (item.href) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  if (item.basePath && pathname.startsWith(item.basePath)) {
    return true;
  }

  return item.dropdown?.some((entry) => pathname.startsWith(entry.href)) ?? false;
}

function ContactButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/contato"
      className={`nav-focus inline-flex border border-navy/30 px-5 py-[9px] text-caption uppercase tracking-[0.22em] text-navy transition duration-200 hover:border-terra hover:bg-terra hover:text-white ${className}`}
    >
      Contato
    </Link>
  );
}

function DesktopDropdown({ item, active }: { item: NavItem; active: boolean }) {
  const entries = item.dropdown ?? [];

  return (
    <div className="group relative">
      <button
        className={`nav-focus border-b py-1 text-detail tracking-[0.08em] transition duration-200 ${
          active
            ? "border-terra text-terra opacity-100"
            : "border-transparent text-navy opacity-50 hover:opacity-100"
        }`}
        type="button"
      >
        {item.label}
      </button>
      {entries.length > 0 ? (
        <div className="invisible absolute left-1/2 top-full z-[60] w-64 -translate-x-1/2 pt-5 opacity-0 transition duration-200 group-hover:visible group-hover:opacity-100">
          <div className="max-h-[calc(100dvh-92px)] overflow-y-auto overscroll-contain border border-navy/10 bg-offwhite shadow-nav-blur">
            {entries.map((entry) => (
              <Link
                className="nav-focus block border-b border-navy/10 px-5 py-4 text-detail tracking-[0.08em] text-navy/60 transition duration-200 last:border-b-0 hover:bg-white/55 hover:text-terra"
                href={entry.href}
                prefetch={false}
                key={entry.href}
              >
                {entry.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileDropdown({
  item,
  active,
  closeMenu,
}: {
  item: NavItem;
  active: boolean;
  closeMenu: () => void;
}) {
  const [open, setOpen] = useState(active);
  const entries = item.dropdown ?? [];

  return (
    <div className="border-b border-navy/10">
      <button
        className={`nav-focus flex w-full items-center justify-between px-5 py-4 text-left text-[14px] tracking-[0.06em] ${
          active ? "text-terra" : "text-navy"
        }`}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {item.label}
        {entries.length > 0 ? (
          <span
            aria-hidden
            className={`text-[14px] leading-none text-navy transition duration-200 ${
              open ? "rotate-45" : ""
            }`}
          >
            +
          </span>
        ) : null}
      </button>
      {entries.length > 0 ? (
        <div
          className={`overflow-y-auto overscroll-contain bg-white/25 transition-[max-height] duration-300 ${
            open ? "max-h-[min(50dvh,360px)]" : "max-h-0 overflow-hidden"
          }`}
        >
          {entries.map((entry) => (
            <Link
              className="nav-focus block border-t border-navy/10 px-8 py-3 text-detail tracking-[0.08em] text-navy/65"
              href={entry.href}
              prefetch={false}
              key={entry.href}
              onClick={closeMenu}
            >
              {entry.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function HeaderClient({
  condominios,
  lancamentos,
}: {
  condominios: NavDropdownItem[];
  lancamentos: NavDropdownItem[];
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const navItems = getNavItems(lancamentos, condominios);
  const navigationRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setNavOpen(false); }, [pathname]);
  useEffect(() => {
    if (!navOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!navigationRef.current?.contains(event.target as Node)) setNavOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNavOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [navOpen]);

  return (
    <>
      <nav ref={navigationRef} aria-label="Navegação principal" onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setNavOpen(false); }} className="fixed left-0 right-0 top-0 z-50 border-b border-navy/10 bg-offwhite/95 py-3.5 backdrop-blur-2xl">
        <div className="site-container flex items-center justify-between">
          <Link
            aria-label="Inglaterra Premium"
            className="nav-focus block origin-left scale-[0.85] md:scale-100"
            href="/"
          >
            <Image
              alt="Inglaterra Premium"
              height={34}
              priority
              src="/images/logo-navy.png"
              width={169}
              className="h-[34px] w-auto"
            />
          </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item);

            if (item.dropdown) {
              return (
                <DesktopDropdown active={active} item={item} key={item.label} />
              );
            }

            return (
              <Link
                className={`nav-focus border-b py-1 text-detail tracking-[0.08em] transition duration-200 ${
                  active
                    ? "border-terra text-terra opacity-100"
                    : "border-transparent text-navy opacity-50 hover:opacity-100"
                }`}
                href={item.href ?? "/"}
                key={item.label}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
        <ContactButton className="hidden lg:inline-flex" />

          <button
            ref={menuButtonRef}
            aria-controls="site-extra-menu"
            aria-expanded={navOpen}
            aria-label={navOpen ? "Fechar menu" : "Abrir menu"}
            className="nav-focus flex h-11 w-11 flex-col items-center justify-center gap-[5px] text-navy"
            onClick={() => setNavOpen((value) => !value)}
            type="button"
          >
            <span
              className={`block h-px w-[26px] bg-navy transition duration-200 ${
                navOpen ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-px w-[26px] bg-navy transition duration-200 ${
                navOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-px w-[26px] bg-navy transition duration-200 ${
                navOpen ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </button>
          </div>
        </div>

      {navOpen ? <div
        id="site-extra-menu"
        aria-label="Mais opções de navegação"
        className="absolute left-0 right-0 top-full max-h-[calc(100dvh-74px)] overflow-y-auto overscroll-contain border-b border-navy/10 bg-offwhite shadow-nav-blur lg:left-auto lg:right-6 lg:w-80 lg:border lg:rounded-sm"
      >
        <div className="lg:hidden">
        {navItems.map((item) => {
          const active = isActive(pathname, item);

          if (item.dropdown) {
            return (
              <MobileDropdown
                active={active}
                closeMenu={() => setNavOpen(false)}
                item={item}
                key={item.label}
              />
            );
          }

          return (
            <Link
              className={`nav-focus block w-full border-b border-navy/10 px-5 py-4 text-left text-[14px] tracking-[0.06em] ${
                active ? "text-terra" : "text-navy"
              }`}
              href={item.href ?? "/"}
              key={item.label}
              onClick={() => setNavOpen(false)}
            >
              {item.label}
            </Link>
          );
        })}
        </div>
        <p className="px-5 pb-2 pt-5 text-caption uppercase tracking-[0.22em] text-sand">Mais opções</p>
        {extraLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            target={item.href.startsWith("https://") ? "_blank" : undefined}
            rel={item.href.startsWith("https://") ? "noopener noreferrer" : undefined}
            className="nav-focus block border-b border-navy/10 px-5 py-4 text-[14px] tracking-[0.06em] text-navy transition hover:bg-navy/5 hover:text-terra"
            onClick={() => setNavOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <div className="p-5 lg:hidden" onClick={() => setNavOpen(false)}>
          <ContactButton />
        </div>
      </div> : null}
      </nav>
    </>
  );
}
