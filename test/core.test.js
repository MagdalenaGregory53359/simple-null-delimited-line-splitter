import { test } from 'node:test';
import assert from 'node:assert/strict';
import { split, splitString, splitBuffer } from '../src/core.js';

// --- splitString ---

test('splitString: basic two-record string', () => {
  assert.deepEqual(splitString('hello\u0000world'), ['hello', 'world']);
});

test('splitString: no NUL returns single record', () => {
  assert.deepEqual(splitString('just text'), ['just text']);
});

test('splitString: trailing NUL produces trailing empty record', () => {
  assert.deepEqual(splitString('a\u0000'), ['a', '']);
});

test('splitString: leading NUL produces leading empty record', () => {
  assert.deepEqual(splitString('\u0000b'), ['', 'b']);
});

test('splitString: consecutive NULs produce empty records', () => {
  assert.deepEqual(splitString('a\u0000\u0000b'), ['a', '', 'b']);
});

test('splitString: empty input returns empty array', () => {
  assert.deepEqual(splitString(''), []);
});

test('splitString: only NULs produce only empty records', () => {
  assert.deepEqual(splitString('\u0000\u0000'), ['', '', '']);
});

// --- splitBuffer ---

test('splitBuffer: basic two-record buffer', () => {
  const input = Buffer.from('hello\u0000world');
  const result = splitBuffer(input);
  assert.equal(result.length, 2);
  assert.equal(result[0].toString(), 'hello');
  assert.equal(result[1].toString(), 'world');
});

test('splitBuffer: no NUL returns single record', () => {
  const input = Buffer.from('just text');
  const result = splitBuffer(input);
  assert.equal(result.length, 1);
  assert.equal(result[0].toString(), 'just text');
});

test('splitBuffer: trailing NUL produces trailing empty record', () => {
  const input = Buffer.from('a\u0000');
  const result = splitBuffer(input);
  assert.equal(result.length, 2);
  assert.equal(result[0].toString(), 'a');
  assert.equal(result[1].toString(), '');
  assert.equal(result[1].length, 0);
});

test('splitBuffer: consecutive NULs produce empty records', () => {
  const input = Buffer.from('a\u0000\u0000b');
  const result = splitBuffer(input);
  assert.equal(result.length, 3);
  assert.equal(result[1].toString(), '');
  assert.equal(result[1].length, 0);
});

test('splitBuffer: empty buffer returns empty array', () => {
  assert.deepEqual(splitBuffer(Buffer.alloc(0)), []);
});

test('splitBuffer: result slices share memory with input (zero-copy)', () => {
  // Mutating the original buffer should be visible in the slice, proving
  // no copy was made. This is the documented behaviour.
  const input = Buffer.from('hello\u0000world');
  const result = splitBuffer(input);
  input[0] = 0x48; // 'H'
  assert.equal(result[0][0], 0x48);
});

// --- split (dispatch) ---

test('split: dispatches to splitString for string input', () => {
  assert.deepEqual(split('a\u0000b'), ['a', 'b']);
});

test('split: dispatches to splitBuffer for Buffer input', () => {
  const input = Buffer.from('a\u0000b');
  const result = split(input);
  assert.equal(result.length, 2);
  assert.equal(result[0].toString(), 'a');
});

test('split: throws TypeError for invalid input type', () => {
  assert.throws(() => split(42), TypeError);
  assert.throws(() => split(null), TypeError);
  assert.throws(() => split(undefined), TypeError);
});
