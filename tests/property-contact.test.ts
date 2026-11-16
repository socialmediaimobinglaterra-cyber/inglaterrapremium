import assert from 'node:assert/strict';
import { test } from 'node:test';
import { brazilianPhone, propertyContactUrl, propertyWhatsappTarget } from '../lib/property-contact';
import { contactSettings } from '../lib/contact-settings';

test('routes direct WhatsApp contact to the Premium number while preserving the message', () => {
  const target = propertyWhatsappTarget('https://wa.me/554333413010?text=Tenho%20interesse');
  assert.equal(target?.pathname, '/5543967270963');
  assert.equal(target?.searchParams.get('text'), 'Tenho interesse');
  assert.equal(propertyWhatsappTarget(contactSettings.whatsapp), null);
  assert.equal(contactSettings.whatsapp, 'https://link.imobiliariainglaterra.com.br/p/imobiliaria-inglaterra');
});

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
  assert.equal(url.pathname, '/5543967270963');
  assert.equal(url.searchParams.get('tracking'), null);
  assert.equal(url.searchParams.get('text'), 'Ref: AP123\nhttps://example.com/imoveis/ap123?foco=locacao\n\nNome: Cliente teste\nWhatsApp: (43) 99999-0000\n\nVisita & disponibilidade?');
  assert.equal(propertyContactUrl(url.toString(), { name: '', phone: '123', message: '' }, 'ref'), null);
});

test('keeps the property link at the start even when the customer replaces the message', () => {
  const context = 'Referência: AP123\nhttps://inglaterrapremium.com/imoveis/ap123?foco=venda';
  const href = propertyContactUrl(contactSettings.propertyWhatsapp, {
    name: 'Cliente teste', phone: '(43) 99999-0000', message: 'Quero conhecer. '.repeat(200),
  }, context);
  const message = new URL(href!).searchParams.get('text')!;
  assert(message.startsWith(context + '\n\nNome: Cliente teste'));
  assert.equal(message.split('https://inglaterrapremium.com/imoveis/ap123').length - 1, 1);
});
