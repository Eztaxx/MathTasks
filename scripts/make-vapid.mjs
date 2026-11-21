// scripts/make-vapid.mjs
// Ключи VAPID для напоминаний (worker/push.js): node scripts/make-vapid.mjs
//
// Создаётся один раз. Открытый ключ браузер получает с /api/push/key,
// закрытый хранится только в секретах воркера. Если ключи поменять, все
// подписки перестанут работать и ученикам придётся включить напоминание
// заново — без нужды не меняйте.

import { webcrypto } from 'node:crypto';

const { subtle } = webcrypto;
const base64url = bytes => Buffer.from(bytes).toString('base64url');

const pair = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const publicKey = base64url(new Uint8Array(await subtle.exportKey('raw', pair.publicKey)));
const { d: privateKey } = await subtle.exportKey('jwk', pair.privateKey);

console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log('');
console.log('Сохраните в секреты воркера (каждая команда спросит значение):');
console.log('  npx wrangler secret put VAPID_PUBLIC_KEY');
console.log('  npx wrangler secret put VAPID_PRIVATE_KEY');
console.log('По желанию — адрес для связи сервисов пушей (по умолчанию https://mathtasks.lv):');
console.log('  npx wrangler secret put VAPID_SUBJECT');
