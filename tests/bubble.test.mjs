import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARDS, LETTERS, boardCells, hanging, MIN_PUSH } from '../js/data/bubble-boards.js';

const MAX_ROWS = 8;

test('every board is laid out on the grid, with known colours', () => {
  for (const b of BOARDS) {
    assert.ok(b.rows.length <= MAX_ROWS, `${b.name} fits above the line with room to lower`);
    b.rows.forEach((row, r) => {
      assert.equal(row.length, r % 2 ? 9 : 10, `${b.name} row ${r}`);
      assert.match(row, new RegExp(`^[.${LETTERS}]+$`), `${b.name} row ${r}`);
    });
    assert.ok(b.push >= MIN_PUSH, b.name);
  }
});

test('every bubble hangs from the ceiling', () => {
  for (let level = 1; level <= BOARDS.length; level++) {
    const { name, cells } = boardCells(level), held = hanging(cells);
    cells.forEach((row, r) => row.forEach((v, c) => { if (v !== null) assert.ok(held.has(`${r},${c}`), `${name} ${r},${c} floats`); }));
  }
});

test('a lap recolours a board but keeps its layout and colours', () => {
  const a = boardCells(1), b = boardCells(BOARDS.length + 1);
  assert.equal(a.name, b.name);
  assert.equal(b.push, Math.max(MIN_PUSH, BOARDS[0].push - 1));
  const set = (x) => new Set(x.cells.flat().filter(v => v !== null));
  assert.deepEqual([...set(a)].sort(), [...set(b)].sort());
  assert.notDeepEqual(a.cells, b.cells);
  a.cells.forEach((row, r) => row.forEach((v, c) => assert.equal(v === null, b.cells[r][c] === null)));
});
