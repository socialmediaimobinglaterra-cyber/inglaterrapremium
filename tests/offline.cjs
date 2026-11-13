// Test process only: reject accidental real network access before loading application code.
const deny = () => { throw new Error("Real network disabled in offline tests"); };
globalThis.fetch = deny;
for (const name of ["node:http", "node:https"]) {
  const mod = require(name); mod.request = deny; mod.get = deny;
}
const net = require("node:net"); net.connect = deny; net.createConnection = deny; net.Socket.prototype.connect = deny;
require("node:tls").connect = deny;
require("node:module").syncBuiltinESMExports();
