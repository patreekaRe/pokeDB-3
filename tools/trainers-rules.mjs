// firestore.rules' trainers/ and codes/ rules against the real Firestore emulator (needs Java). In an empty folder:
//   npm i firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10
//   echo '{"emulators":{"firestore":{"port":8089,"host":"127.0.0.1"}}}' > firebase.json
//   cp <repo>/tools/trainers-rules.mjs . && RULES=<repo>/firestore.rules npx firebase emulators:exec --only firestore --project demo-trainers "node trainers-rules.mjs"
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
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
await ok(setDoc(doc(A, 'trainers/uidA'), page('ABCDEFGH', { card: { ...card, rank: 2, top: 5, fave: 'cyndaquil', pillar: 18 } })), 'the card\'s newer numbers are taken');
await ok(setDoc(doc(A, 'trainers/uidA'), page('ABCDEFGH', { card: { ...card, rank: -1, top: -1, fave: '', pillar: 0 } })), 'and their "none" values');
await no(setDoc(doc(A, 'trainers/uidA'), page('ABCDEFGH', { card: { ...card, pillar: 5000 } })), 'a Sky Pillar floor past 999 is refused');
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

const blurb = { name: 'ASH', buddy: 'starter:squirtle', partner: 'starter:charmander:2', tier: 'gold', badges: 3, wins: 7 };
await ok(setDoc(doc(A, 'plaza/uidA'), { ...blurb, at: serverTimestamp() }), 'A stands in the Plaza');
await no(setDoc(doc(B, 'plaza/uidA'), { ...blurb, at: serverTimestamp() }), 'B can\'t stand A there');
await no(setDoc(doc(B, 'plaza/uidB'), { ...blurb, base: 'x', at: serverTimestamp() }), 'a Plaza entry takes nothing extra');
await no(setDoc(doc(B, 'plaza/uidB'), { ...blurb, tier: 'mauve', at: serverTimestamp() }), 'a bad tier is refused');
await no(setDoc(doc(B, 'plaza/uidB'), { ...blurb, at: new Date(0) }), 'a made-up time is refused');
await ok(setDoc(doc(B, 'plaza/uidB'), { ...blurb, name: 'MISTY', at: serverTimestamp() }), 'B stands in the Plaza');
await ok(getDocs(query(collection(B, 'plaza'), orderBy('at', 'desc'), limit(31))), 'B lists the Plaza, newest first');
await no(getDocs(collection(anon, 'plaza')), 'signed out can\'t list it');
await no(deleteDoc(doc(B, 'plaza/uidA')), 'B can\'t take A down');
await ok(deleteDoc(doc(B, 'plaza/uidB')), 'B hides');

const add = (from, to, extra = {}) => ({ from, to, ...blurb, seen: false, at: serverTimestamp(), ...extra });
await ok(setDoc(doc(B, 'adds/uidA_uidB'), add('uidB', 'uidA')), 'B leaves A a note');
await ok(setDoc(doc(B, 'adds/uidA_uidB'), add('uidB', 'uidA')), 'B re-adding raises it again');
await no(setDoc(doc(B, 'adds/uidC_uidA'), add('uidA', 'uidC')), 'B can\'t leave one as A');
await no(setDoc(doc(B, 'adds/uidX_uidB'), add('uidB', 'uidA')), 'the id must be to_from');
await no(setDoc(doc(B, 'adds/uidB_uidB'), add('uidB', 'uidB')), 'not to yourself');
await no(setDoc(doc(B, 'adds/uidC_uidB'), add('uidB', 'uidC', { seen: true })), 'a note starts unseen');
await no(setDoc(doc(B, 'adds/uidC_uidB'), add('uidB', 'uidC', { extra: 1 })), 'a note takes nothing extra');
await ok(getDocs(query(collection(A, 'adds'), where('to', '==', 'uidA'))), 'A lists the notes left for them');
await ok(getDoc(doc(A, 'adds/uidA_uidB')), 'A reads one');
await no(getDocs(collection(A, 'adds')), 'A can\'t list everyone\'s notes');
await no(getDocs(query(collection(B, 'adds'), where('to', '==', 'uidA'))), 'B can\'t list A\'s notes');
await no(getDoc(doc(B, 'adds/uidA_uidB')), 'B can\'t even read the one they left');
await no(updateDoc(doc(A, 'adds/uidA_uidB'), { seen: true, name: 'HAX' }), 'A marks seen and nothing else');
await ok(updateDoc(doc(A, 'adds/uidA_uidB'), { seen: true }), 'A marks it seen');
await no(updateDoc(doc(B, 'adds/uidA_uidB'), { seen: false }), 'B can\'t unsee it by hand');
await ok(deleteDoc(doc(B, 'adds/uidA_uidB')), 'B takes it back on removing A');
await ok(setDoc(doc(B, 'adds/uidA_uidB'), add('uidB', 'uidA')), 'B adds A again');
await no(deleteDoc(doc(env.authenticatedContext('uidC').firestore(), 'adds/uidA_uidB')), 'C can\'t delete it');
await ok(deleteDoc(doc(A, 'adds/uidA_uidB')), 'A can clear it');
await env.cleanup();
console.log(fails ? `${fails} FAILED` : 'all rules checks passed');
process.exit(fails ? 1 : 0);
