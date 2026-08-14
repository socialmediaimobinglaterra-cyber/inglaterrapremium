"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

const condominios = [
  { label: "Royal Golf Residence", href: "/condominios/royal-golf-residence" },
  { label: "Country Club", href: "/condominios/country-club" },
  { label: "Terras de Canaã", href: "/condominios/terras-de-canaa" },
];

function getNavItems(lancamentos: NavDropdownItem[]): NavItem[] {
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
      className={`nav-focus inline-flex border border-navy/30 px-5 py-[9px] text-[9px] uppercase tracking-[0.22em] text-navy transition duration-200 hover:border-terra hover:bg-terra hover:text-white ${className}`}
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
        className={`nav-focus border-b py-1 text-[11px] tracking-[0.08em] transition duration-200 ${
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
          <div className="border border-navy/10 bg-offwhite shadow-nav-blur">
            {entries.map((entry) => (
              <Link
                className="nav-focus block border-b border-navy/10 px-5 py-4 text-[11px] tracking-[0.08em] text-navy/55 transition duration-200 last:border-b-0 hover:bg-white/55 hover:text-terra"
                href={entry.href}
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
        className={`nav-focus flex w-full items-center justify-between px-5 py-4 text-left text-[13px] tracking-[0.06em] ${
          active ? "text-terra" : "text-navy"
        }`}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {item.label}
        {entries.length > 0 ? (
          <span
            aria-hidden
            className={`text-[14px] leading-none text-sand transition duration-200 ${
              open ? "rotate-45" : ""
            }`}
          >
            +
          </span>
        ) : null}
      </button>
      {entries.length > 0 ? (
        <div
          className={`overflow-hidden bg-white/25 transition-[max-height] duration-300 ${
            open ? "max-h-56" : "max-h-0"
          }`}
        >
          {entries.map((entry) => (
            <Link
              className="nav-focus block border-t border-navy/10 px-8 py-3 text-[11px] tracking-[0.08em] text-navy/60"
              href={entry.href}
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

export function HeaderClient({ lancamentos }: { lancamentos: NavDropdownItem[] }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const navItems = getNavItems(lancamentos);

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-navy/10 bg-offwhite/95 py-3.5 backdrop-blur-2xl">
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

        <div className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item);

            if (item.dropdown) {
              return (
                <DesktopDropdown active={active} item={item} key={item.label} />
              );
            }

            return (
              <Link
                className={`nav-focus border-b py-1 text-[11px] tracking-[0.08em] transition duration-200 ${
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

        <ContactButton className="hidden md:inline-flex" />

          <button
            aria-expanded={navOpen}
            aria-label={navOpen ? "Fechar menu" : "Abrir menu"}
            className="nav-focus flex h-[26px] w-[26px] flex-col justify-center gap-[5px] md:hidden"
            onClick={() => setNavOpen((value) => !value)}
            type="button"
          >
            <span
              className={`block h-px w-full bg-navy transition duration-200 ${
                navOpen ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-px w-full bg-navy transition duration-200 ${
                navOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-px w-full bg-navy transition duration-200 ${
                navOpen ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      <div
        className={`fixed left-0 right-0 top-[54px] z-[49] overflow-hidden border-b border-navy/10 bg-offwhite transition-[max-height] duration-300 md:hidden ${
          navOpen ? "max-h-[620px]" : "max-h-0"
        }`}
      >
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
              className={`nav-focus block w-full border-b border-navy/10 px-5 py-4 text-left text-[13px] tracking-[0.06em] ${
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
        <div className="p-5">
          <ContactButton />
        </div>
      </div>
    </>
  );
}
