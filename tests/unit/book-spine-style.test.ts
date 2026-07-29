import assert from 'node:assert/strict';
import test from 'node:test';
import { FALLBACK_SPINE_COLOR, PAGE_EDGE_GRADIENT, getBookSpinePalette } from '../../src/components/written/bookSpineStyle';

test('produces a three-stop gradient that includes the base color', () => {
    const { spineGradient } = getBookSpinePalette('#3a6ea5');
    assert.match(spineGradient, /^linear-gradient\(100deg, #[0-9a-f]{6} 0%, #3a6ea5 45%, #[0-9a-f]{6} 100%\)$/);
});

test('picks dark ink for a near-white base color', () => {
    const { textColor } = getBookSpinePalette('#f5f2ea');
    assert.equal(textColor, '#1a1208');
});

test('picks light ink for a near-black base color', () => {
    const { textColor } = getBookSpinePalette('#0a0a0a');
    assert.equal(textColor, '#f5f0e6');
});

test('is deterministic for the same input', () => {
    const first = getBookSpinePalette('#7a3b3b');
    const second = getBookSpinePalette('#7a3b3b');
    assert.deepEqual(first, second);
});

test('exposes a fixed page-edge gradient and fallback color', () => {
    assert.match(PAGE_EDGE_GRADIENT, /^repeating-linear-gradient\(/);
    assert.match(FALLBACK_SPINE_COLOR, /^#[0-9a-f]{6}$/);
});
