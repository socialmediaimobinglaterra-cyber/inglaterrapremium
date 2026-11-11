export function brazilianPhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  const local = digits.length === 12 || digits.length === 13 ? (digits.startsWith("55") ? digits.slice(2) : "") : digits;
  return /^[1-9]{2}(?:[2-9]\d{7}|9\d{8})$/.test(local) ? `55${local}` : null;
}

export function propertyWhatsappTarget(href: string | null | undefined) {
  try {
    const url = new URL(href ?? "");
    if (url.protocol !== "https:" || url.hostname !== "wa.me" || url.port || url.username || url.password || !/^\/55\d{10,11}$/.test(url.pathname)) return null;
    return url;
  } catch { return null; }
}

export function propertyContactUrl(href: string, contact: { name: string; phone: string; message: string }, context: string) {
  const target = propertyWhatsappTarget(href);
  if (!target || !contact.name.trim() || !brazilianPhone(contact.phone) || !contact.message.trim()) return null;
  const url = new URL(target.origin + target.pathname);
  url.searchParams.set("text", [
    `Nome: ${contact.name.trim().slice(0, 120)}`,
    `WhatsApp: ${contact.phone.trim().slice(0, 30)}`,
    "", contact.message.trim().slice(0, 2000), "", context,
  ].join("\n"));
  return url.toString();
}
