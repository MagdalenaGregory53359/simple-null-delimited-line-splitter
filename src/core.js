/**
 * Split a string or Buffer into records delimited by NUL (0x00) bytes.
 *
 * Design decisions:
 * - We split on a single NUL byte. Consecutive NULs produce empty records, which
 *   matches how `awk -v RS='\0'` behaves: every separator yields a field, so
 *   "a\0\0b" is three records ["a", "", "b"]. This is intentional and tested.
 *   The alternative (treat runs of NULs as one separator) was rejected because
 *   it hides data-corruption cases where an expected field is missing.
 * - A trailing NUL yields a trailing empty record, because the separator's
 *   presence implies a field after it. "a\0" -> ["a", ""], not ["a"]. This
 *   mirrors how split() works on newlines for text processing.
 * - Empty input returns [] (zero records), not [""]. No data means no records.
 * - For Buffer input, each record is returned as a Buffer slice (no copy) to
 *   keep zero-copy semantics. Callers who need stable buffers should call
 *   Buffer.from() on results themselves. We return subarrays of the original
 *   so large files don't double their memory footprint during parsing.
 * - String input returns strings. Mixed input is not supported: pass either
 *   a string or a Buffer, not both in the same call.
 */

const NUL = 0x00;

/**
 * Split a string on NUL bytes.
 * @param {string} input
 * @returns {string[]} Records in order. Empty input gives [].
 */
export function splitString(input) {
  if (input === '') return [];
  return input.split('\u0000');
}

/**
 * Split a Buffer on NUL bytes. Returns Buffer slices (no copy).
 * @param {Buffer} input
 * @returns {Buffer[]} Records in order. Empty input gives [].
 */
export function splitBuffer(input) {
  if (input.length === 0) return [];

  const records = [];
  let start = 0;

  for (let i = 0; i < input.length; i++) {
    if (input[i] === NUL) {
      records.push(input.subarray(start, i));
      start = i + 1;
    }
  }

  // The last record (after the final NUL, or the whole input if no NUL).
  // This is always present because we only enter the loop for non-empty input.
  records.push(input.subarray(start));

  return records;
}

/**
 * Split on NUL bytes. Dispatches on input type.
 * @param {string|Buffer} input
 * @returns {string[]|Buffer[]}
 */
export function split(input) {
  if (typeof input === 'string') return splitString(input);
  if (Buffer.isBuffer(input)) return splitBuffer(input);
  throw new TypeError('split() expects a string or Buffer');
}
