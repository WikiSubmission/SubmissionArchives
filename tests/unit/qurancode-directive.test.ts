import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseFinding,
  serializeFinding,
  type FindingAttributes,
} from '../../studio/src/lib/quranCodeDirective'

/**
 * The `::: qcvalue {…} :::` directive is what a research finding becomes inside
 * a note, and notes are plain Markdown that outlive Studio. These cover the
 * round trip and the refusals, because a finding that loses its provenance in
 * transit is worse than one that was never written.
 *
 * Tested here rather than in the studio app because studio has no test runner
 * of its own, and the module is deliberately dependency-free so it runs
 * anywhere.
 */

const base: FindingAttributes = {
  ref: '33:33',
  system: 'abjad_standard',
  mode: 'simplified29',
  value: 6795,
  letters: 122,
  words: 25,
  modifiers: '',
  unverified: false,
}

test('a plain finding round-trips byte for byte', () => {
  const text = serializeFinding(base)
  assert.equal(
    text,
    '::: qcvalue {ref="33:33" system="abjad_standard" mode="simplified29" value="6795" letters="122" words="25"} :::'
  )
  assert.deepEqual(parseFinding(text), base)
  assert.equal(serializeFinding(parseFinding(text)!), text)
})

test('optional attributes are omitted when empty and kept when set', () => {
  assert.ok(!serializeFinding(base).includes('modifiers'))
  assert.ok(!serializeFinding(base).includes('unverified'))

  const rich: FindingAttributes = {
    ...base,
    modifiers: 'letter_number_in_word,chapter_number',
    unverified: true,
  }
  const text = serializeFinding(rich)
  assert.ok(text.includes('modifiers="letter_number_in_word,chapter_number"'))
  assert.ok(text.includes('unverified="true"'))
  assert.deepEqual(parseFinding(text), rich)
})

test('the unverified flag survives the round trip, because the note depends on it', () => {
  const flagged = { ...base, unverified: true }
  const parsed = parseFinding(serializeFinding(flagged))
  assert.equal(parsed?.unverified, true)
  // and its absence is not silently read as true
  assert.equal(parseFinding(serializeFinding(base))?.unverified, false)
})

test('non-verse scopes round-trip too', () => {
  for (const ref of ['chapter 33', 'corpus', '33:33:24']) {
    const parsed = parseFinding(serializeFinding({ ...base, ref }))
    assert.equal(parsed?.ref, ref)
  }
})

test('surrounding whitespace does not defeat the parser', () => {
  const text = serializeFinding(base)
  assert.deepEqual(parseFinding(`   ${text}   `), base)
})

test('anything that is not a qcvalue directive is refused', () => {
  const rejects = [
    '',
    'plain prose',
    '::: quran {verses="1:1"} :::',
    '::: qcvalue {} :::', // no ref, so no provenance
    '::: qcvalue {system="abjad_standard"} :::',
    'text before ::: qcvalue {ref="1:1"} :::',
  ]
  for (const input of rejects) {
    assert.equal(parseFinding(input), null, `should refuse: ${input}`)
  }
})

test('a quote inside a value cannot break out of the directive', () => {
  const hostile = { ...base, ref: '33:33" evil="yes' }
  const text = serializeFinding(hostile)
  assert.equal((text.match(/"/g) ?? []).length % 2, 0, 'quotes stay balanced')
  assert.ok(!text.includes('evil="yes"'), 'the injected attribute is not emitted')
  assert.equal(parseFinding(text)?.ref, '33:33 evil=yes')
})

test('numeric fields come back as numbers, not strings', () => {
  const parsed = parseFinding(serializeFinding(base))!
  assert.equal(typeof parsed.value, 'number')
  assert.equal(typeof parsed.letters, 'number')
  assert.equal(typeof parsed.words, 'number')
})
