// firestore.rules' trainers/ and codes/ rules against the real Firestore emulator (needs Java). In an empty folder:
//   npm i firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10
//   echo '{"emulators":{"firestore":{"port":8089,"host":"127.0.0.1"}}}' > firebase.json
//   cp <repo>/tools/trainers-rules.mjs . && RULES=<repo>/firestore.rules npx firebase emulators:exec --only firestore --project demo-trainers "node trainers-rules.mjs"
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
const env = await initializeTestEnvironment({ projectId: 'demo-trainers', firestore: { rules: readFileSync(process.env.RULES || new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8089 } });
const A = env.authenticatedContext('uidA').firestore(), B = env.authenticatedContext('uidB').firestore(), anon = env.unauthenticatedContext().firestore();
let fails = 0;
const ok = async (p, what) => { try { await assertSucceeds(p); console.log('PASS ', what); } catch (e) { fails++; console.log('FAIL ', what, e.message); } };
const no = async (p, what) => { try { await assertFails(p); console.log('PASS ', what); } catch (e) { fails++; console.log('FAIL ', what, e.message); } };
const card = { tier: 'gold', badges: ['first-win'], wins: 7, dex: 20, dexOf: 151, safari: 0, safariOf: 0, stars: 1, time: 205, partner: 'starter:charmander:2' };
const page = (code, extra = {}) => ({ code, name: 'ASH', card, buddy: 'starter:squirtle', base: '{"v":2}', at: serverTimestamp(), ...extra });

await ok(setDoc(doc(A, 'codes/ABCDEFGH'), { uid: 'uidA' }), 'A claims a code');
await no(setDoc(doc(B, 'codes/ABCDEFGH'), { uid: 'uidB' }), 'B can\'t take A\'s code (create-only)');
await no(setDoc(doc(A, 'codes/ABCDEFGH'), { uid: 'uidA' }), 'not even A can rewrite it');
await no(setDoc(doc(B, 'codes/BBBBBBBO'), { uid: 'uidB' }), 'a code with a look-alike (O) is refused');
await no(setDoc(doc(B, 'codes/BBBBBBBB'), { uid: 'uidA' }), 'a code claimed for someone else is refused');
await no(setDoc(doc(anon, 'codes/CCCCCCCC'), { uid: 'x' }), 'signed out can\'t claim');
await ok(setDoc(doc(B, 'codes/BBBBBBBB'), { uid: 'uidB' }), 'B claims a code');
await ok(getDoc(doc(B, 'codes/ABCDEFGH')), 'B looks up A\'s code');
await no(getDoc(doc(anon, 'codes/ABCDEFGH')), 'signed out can\'t look one up');
await no(getDocs(collection(B, 'codes')), 'codes can\'t be listed');
await no(deleteDoc(doc(A, 'codes/ABCDEFGH')), 'a code can\'t be deleted');

await ok(setDoc(doc(A, 'trainers/uidA'), page('ABCDEFGH')), 'A writes their page');
await ok(setDoc(doc(A, 'trainers/uidA'), page('ABCDEFGH', { name: 'ASHY' })), 'A rewrites it');
await ok(setDoc(doc(A, 'trainers/uidA'), (({ base, ...p }) => p)(page('ABCDEFGH'))), 'a page without a base is fine');
await no(setDoc(doc(B, 'trainers/uidA'), page('BBBBBBBB')), 'B can\'t write A\'s page');
await no(setDoc(doc(B, 'trainers/uidB'), page('ABCDEFGH')), 'B can\'t use A\'s code on their page');
await no(setDoc(doc(B, 'trainers/uidB'), page('ZZZZZZZZ')), 'nor a code nobody claimed');
await no(setDoc(doc(B, 'trainers/uidB'), page('BBBBBBBB', { name: 'X'.repeat(17) })), 'a name past 16 is refused');
await no(setDoc(doc(B, 'trainers/uidB'), page('BBBBBBBB', { name: '' })), 'an empty name is refused');
await no(setDoc(doc(B, 'trainers/uidB'), page('BBBBBBBB', { extra: 1 })), 'an extra key is refused');
await no(setDoc(doc(B, 'trainers/uidB'), page('BBBBBBBB', { at: new Date(0) })), 'a made-up time is refused');
await no(setDoc(doc(B, 'trainers/uidB'), page('BBBBBBBB', { card: { ...card, tier: 'mauve' } })), 'a bad card tier is refused');
await no(setDoc(doc(B, 'trainers/uidB'), page('BBBBBBBB', { card: { ...card, hax: 1 } })), 'an extra card key is refused');
await no(setDoc(doc(B, 'trainers/uidB'), page('BBBBBBBB', { card: { ...card, wins: -1 } })), 'a negative count is refused');
await no(setDoc(doc(B, 'trainers/uidB'), page('BBBBBBBB', { base: 'x'.repeat(600001) })), 'a base past 600,000 is refused');
await ok(setDoc(doc(B, 'trainers/uidB'), page('BBBBBBBB')), 'B writes their page');
await ok(getDoc(doc(B, 'trainers/uidA')), 'B reads A\'s page');
await ok(getDoc(doc(B, 'trainers/uidNobody')), 'B reads a page that isn\'t there (it just doesn\'t exist)');
await no(getDoc(doc(anon, 'trainers/uidA')), 'signed out can\'t read pages');
await no(getDocs(collection(B, 'trainers')), 'pages can\'t be listed');
await no(deleteDoc(doc(B, 'trainers/uidA')), 'B can\'t delete A\'s page');
await ok(deleteDoc(doc(B, 'trainers/uidB')), 'B can delete their own');
await no(getDoc(doc(B, 'saves/uidA')), 'saves stay private');
await env.cleanup();
console.log(fails ? `${fails} FAILED` : 'all rules checks passed');
process.exit(fails ? 1 : 0);
