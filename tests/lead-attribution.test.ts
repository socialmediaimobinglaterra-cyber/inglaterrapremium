import assert from "node:assert/strict";
import test from "node:test";
import { attributionFromVisit, parseAttribution } from "../lib/lead-attribution";
import { newsletterPayload, parseNewsletter } from "../lib/newsletter";

test("campaign attribution takes precedence over referral and excludes private query data", () => {
  const attribution = attributionFromVisit("https://premium.example/?utm_source=instagram&utm_medium=paid_social&utm_campaign=Premium-2026&email=private@example.com&gclid=secret&utm_term=private", "https://other.example/private?q=secret");
  assert.deepEqual(attribution, { traffic_source: "instagram", traffic_medium: "paid_social", traffic_campaign: "Premium-2026" });
  const lead = parseNewsletter({ email: "test@example.com", consent: true, attribution });
  const payload = newsletterPayload(lead.email, lead.attribution).payload;
  assert.equal(payload.traffic_source, "instagram");
  assert.equal(payload.conversion_identifier, "inglaterra-premium-newsletter");
  assert(!JSON.stringify(payload).includes("secret"));
});

test("referral uses hostname only; direct and unidentifiable internal navigation remain distinct", () => {
  assert.deepEqual(attributionFromVisit("https://premium.example", "https://news.example/article?email=private@example.com"), { traffic_source: "news.example", traffic_medium: "referral" });
  assert.deepEqual(attributionFromVisit("https://premium.example", ""), { traffic_source: "(direct)", traffic_medium: "(none)" });
  assert.deepEqual(attributionFromVisit("https://premium.example", "https://premium.example/imoveis"), {});
  assert.deepEqual(attributionFromVisit("invalid", ""), {});
  assert.deepEqual(newsletterPayload("test@example.com").payload.traffic_source, undefined);
});

test("server whitelists and bounds attribution without trusting arbitrary fields", () => {
  for (const value of [null, [], "invalid", { traffic_source: "private@example.com" }, { traffic_source: "https://example.com/private" }, { traffic_source: "x".repeat(121) }]) assert.deepEqual(parseAttribution(value), {});
  assert.deepEqual(parseAttribution({ traffic_source: " google ", traffic_campaign: "private@example.com", email: "private@example.com", conversion_identifier: "site-matriz-newsletter" }), { traffic_source: "google" });
});
