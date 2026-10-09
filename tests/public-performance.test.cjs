const assert = require('node:assert/strict');
const { test } = require('node:test');
const { AsyncLocalStorage } = require('node:async_hooks');

// Exercise Next's real cache wrapper with a deterministic, isolated storage adapter.
globalThis.AsyncLocalStorage = AsyncLocalStorage;
const { sanity } = require('../lib/sanity');
const { getSiteNavigation } = require('../lib/queries/navigation');
const { searchImoveis, getImovelBySlug } = require('../lib/queries/imoveis');

test('public navigation reuses reads, expires after 60 seconds and does not cache failures', async (t) => {
  const previous = globalThis.__incrementalCache;
  const entries = new Map();
  let now = 0, reads = 0, fail = false;
  globalThis.__incrementalCache = {
    generateSimpleCacheKey: async (key) => key,
    get: async (key) => {
      const entry = entries.get(key);
      return entry && { value: entry.value, isStale: now - entry.time >= entry.value.revalidate * 1000 };
    },
    set: async (key, value) => { assert.equal(value.revalidate, 60); entries.set(key, { value, time: now }); },
  };
  t.after(() => { globalThis.__incrementalCache = previous; });
  t.mock.method(sanity, 'fetch', async (query) => {
    reads++;
    if (fail) throw new Error('temporarily unavailable');
    assert(!query.includes('imagens'), 'navigation must not query galleries');
    assert(!query.includes('descricaoPublica'), 'navigation must not query descriptions');
    if (query.includes('_type == "lancamento"')) return [];
    if (query.includes('_id, nome, ativo')) return [{ _id: 'sun', nome: 'Sun Lake', slug: null }];
    return [{ _id: 'sun', nome: 'Sun Lake', imoveisCount: 1 }];
  });
  const first = await getSiteNavigation();
  assert.equal(reads, 3);
  assert.equal(first.condominios[0].href, '/condominios/sun-lake');
  assert.deepEqual(await getSiteNavigation(), first);
  assert.equal(reads, 3, 'warm navigation requires no new Sanity calls');
  now = 61000;
  await getSiteNavigation();
  assert.equal(reads, 6, 'expired entry must refresh');
  entries.clear();
  fail = true;
  await assert.rejects(getSiteNavigation(), /temporarily unavailable/);
  assert.equal(entries.size, 0, 'errors must not be stored as empty menus');
  fail = false;
  assert.deepEqual(await getSiteNavigation(), first);
});

test('search returns only cover URLs while detail keeps full gallery; availability remains uncached', async (t) => {
  let detailQuery = '', searches = 0;
  t.mock.method(sanity, 'fetch', async (query) => {
    if (query.includes('slug.current == $slug')) { detailQuery = query; return null; }
    if (query.startsWith('count(')) return 1;
    searches++;
    assert(!query.includes('images[]'), 'cards must not fetch the full photo collection');
    assert(query.includes('coalesce(mainImage.asset->url, images[0].asset->url)'));
    return [{ _id: 'property-a', slug: 'property-a', codigoImovel: 'CA1', title: 'Casa', mainImageUrl: 'https://cdn.sanity.io/cover.jpg' }];
  });
  const result = await searchImoveis({ negocio: 'Comprar' });
  assert.equal(result.imoveis[0].image, 'https://cdn.sanity.io/cover.jpg');
  assert.equal(result.total, 1);
  await searchImoveis({ negocio: 'Comprar' });
  assert.equal(searches, 2);
  await getImovelBySlug('property-a');
  assert(detailQuery.includes('images[].asset->url'));
  assert(detailQuery.includes('status == "ativo" && publicarSite == true'));
});
