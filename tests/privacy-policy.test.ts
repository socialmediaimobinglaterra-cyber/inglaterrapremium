import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { privacyPolicyContent } from "../lib/privacy-policy-content";
import { INQUIRY_CONSENT, INQUIRY_CONSENT_VERSION } from "../lib/property-inquiry";
import { PRIVACY_POLICY_PATH, PRIVACY_POLICY_TITLE } from "../lib/privacy-policy";

test("policy preserves all supplied sections and completes only the approved contact", () => {
  assert.equal(privacyPolicyContent.filter(block => block.kind === "heading").length, 11);
  assert.equal(privacyPolicyContent.filter(block => block.kind === "subheading").length, 1);
  const text = privacyPolicyContent.map(block => block.text).join("\n");
  assert.match(text, /04\.538\.244\/0001-83/);
  assert.match(text, /Vanderson L\. Redon/);
  assert.match(text, /https:\/\/www\.imobiliariainglaterra\.com\.br\//);
  assert.doesNotMatch(text, /EMAIL DE CONTATO DA EMPRESA/);
  assert.equal((text.match(/inteligencia@imobiliariainglaterra\.com\.br/g) || []).length, 3);
});

test("displayed and recorded consent share the requested text and new version", () => {
  assert.equal(INQUIRY_CONSENT_VERSION, "contato-imovel-v2");
  assert.equal(INQUIRY_CONSENT, "Autorizo a Inglaterra Premium a utilizar meus dados para entrar em contato comigo sobre minha solicitação, conforme a Política de Privacidade.");
  assert(INQUIRY_CONSENT.endsWith(`${PRIVACY_POLICY_TITLE}.`));
  assert.equal(PRIVACY_POLICY_PATH, "/politica-de-privacidade");
  const form = readFileSync("components/imoveis/PropertyContactForm.tsx", "utf8");
  assert.match(form, /href=\{PRIVACY_POLICY_PATH\}/);
  assert.match(form, /target="_blank" rel="noopener noreferrer"/);
  assert.match(readFileSync("components/layout/Footer.tsx", "utf8"), /href=\{PRIVACY_POLICY_PATH\}/);
  assert.match(readFileSync("app/sitemap.ts", "utf8"), /politica-de-privacidade/);
});
