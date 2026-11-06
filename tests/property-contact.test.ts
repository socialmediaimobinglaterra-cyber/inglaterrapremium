import assert from 'node:assert/strict';
import { test } from 'node:test';
import { brazilianPhone, propertyContactUrl, propertyWhatsappTarget } from '../lib/property-contact';

test('normalizes national and international phones without confusing DDD 55', () => {
  assert.equal(brazilianPhone('(43) 99999-0000'), '5543999990000');
  assert.equal(brazilianPhone('+55 (43) 3343-3010'), '554333433010');
  assert.equal(brazilianPhone('(55) 99999-0000'), '5555999990000');
  for (const phone of ['', null, '123', '00123456789', '+1 555 123 456789']) assert.equal(brazilianPhone(phone), null);
});

test('only permits direct HTTPS WhatsApp targets', () => {
  assert(propertyWhatsappTarget('https://wa.me/5543999990000'));
  for (const href of ['javascript:alert(1)', 'http://wa.me/5543999990000', 'https://example.com', 'https://user@wa.me/5543999990000', null]) {
    assert.equal(propertyWhatsappTarget(href), null);
  }
});

test('includes edited message and immutable property context without carrying tracking params', () => {
  const href = propertyContactUrl('https://wa.me/5543999990000?text=old&tracking=1', {
    name: ' Cliente teste ', phone: '(43) 99999-0000', message: 'Visita & disponibilidade?'
  }, 'Ref: AP123\nhttps://example.com/imoveis/ap123?foco=locacao');
  const url = new URL(href!);
  assert.equal(url.searchParams.get('tracking'), null);
  assert.equal(url.searchParams.get('text'), 'Nome: Cliente teste\nWhatsApp: (43) 99999-0000\n\nVisita & disponibilidade?\n\nRef: AP123\nhttps://example.com/imoveis/ap123?foco=locacao');
  assert.equal(propertyContactUrl(url.toString(), { name: '', phone: '123', message: '' }, 'ref'), null);
});
