import assert from 'node:assert/strict';
import test from 'node:test';
import {
    IDLE,
    navReduce,
    activeNodeId,
    type NavState,
    type NavBounds,
} from '../../src/app/search/searchNavReducer';

const bounds: NavBounds = {
    cardCount: 3,
    passageCountFor: (cardIndex) => (cardIndex === 0 ? 3 : 1),
};

test('ArrowDown from idle selects the first card and enters nav mode', () => {
    assert.deepEqual(navReduce(IDLE, 'ArrowDown', bounds), {
        mode: 'nav',
        cardIndex: 0,
        passageIndex: -1,
    });
});

test('ArrowDown from idle with no cards stays idle', () => {
    const empty: NavBounds = { cardCount: 0, passageCountFor: () => 0 };
    assert.deepEqual(navReduce(IDLE, 'ArrowDown', empty), IDLE);
});

test('non-ArrowDown keys from idle are ignored', () => {
    assert.deepEqual(navReduce(IDLE, 'ArrowUp', bounds), IDLE);
    assert.deepEqual(navReduce(IDLE, 'ArrowRight', bounds), IDLE);
});

test('card-level ArrowDown moves down and clamps at the last card', () => {
    const atFirst: NavState = { mode: 'nav', cardIndex: 0, passageIndex: -1 };
    assert.equal(navReduce(atFirst, 'ArrowDown', bounds).cardIndex, 1);
    const atLast: NavState = { mode: 'nav', cardIndex: 2, passageIndex: -1 };
    assert.deepEqual(navReduce(atLast, 'ArrowDown', bounds), atLast);
});

test('card-level ArrowUp moves up and exits to idle above the first card', () => {
    const atSecond: NavState = { mode: 'nav', cardIndex: 1, passageIndex: -1 };
    assert.equal(navReduce(atSecond, 'ArrowUp', bounds).cardIndex, 0);
    const atFirst: NavState = { mode: 'nav', cardIndex: 0, passageIndex: -1 };
    assert.deepEqual(navReduce(atFirst, 'ArrowUp', bounds), IDLE);
});

test('ArrowRight drills into passage 0 when the card has passages', () => {
    const atFirst: NavState = { mode: 'nav', cardIndex: 0, passageIndex: -1 };
    assert.equal(navReduce(atFirst, 'ArrowRight', bounds).passageIndex, 0);
    const atSecond: NavState = { mode: 'nav', cardIndex: 1, passageIndex: -1 };
    // card 1 has 1 passage, so ArrowRight still drills to passage 0
    assert.equal(navReduce(atSecond, 'ArrowRight', bounds).passageIndex, 0);
});

test('ArrowLeft at card level is a no-op', () => {
    const atFirst: NavState = { mode: 'nav', cardIndex: 0, passageIndex: -1 };
    assert.deepEqual(navReduce(atFirst, 'ArrowLeft', bounds), atFirst);
});

test('passage-level ArrowDown moves down and clamps at the last passage', () => {
    const p0: NavState = { mode: 'nav', cardIndex: 0, passageIndex: 0 };
    assert.equal(navReduce(p0, 'ArrowDown', bounds).passageIndex, 1);
    const pLast: NavState = { mode: 'nav', cardIndex: 0, passageIndex: 2 };
    assert.deepEqual(navReduce(pLast, 'ArrowDown', bounds), pLast);
});

test('passage-level ArrowUp from passage 0 returns to card level', () => {
    const p0: NavState = { mode: 'nav', cardIndex: 0, passageIndex: 0 };
    assert.equal(navReduce(p0, 'ArrowUp', bounds).passageIndex, -1);
    const p2: NavState = { mode: 'nav', cardIndex: 0, passageIndex: 2 };
    assert.equal(navReduce(p2, 'ArrowUp', bounds).passageIndex, 1);
});

test('passage-level ArrowLeft returns to card level', () => {
    const p1: NavState = { mode: 'nav', cardIndex: 0, passageIndex: 1 };
    assert.deepEqual(navReduce(p1, 'ArrowLeft', bounds), {
        mode: 'nav',
        cardIndex: 0,
        passageIndex: -1,
    });
});

test('Escape from any nav state returns to idle', () => {
    const p1: NavState = { mode: 'nav', cardIndex: 2, passageIndex: 1 };
    assert.deepEqual(navReduce(p1, 'Escape', bounds), IDLE);
});

test('activeNodeId returns card and passage ids, null when idle', () => {
    assert.equal(activeNodeId(IDLE), null);
    assert.equal(
        activeNodeId({ mode: 'nav', cardIndex: 2, passageIndex: -1 }),
        'search-card-2',
    );
    assert.equal(
        activeNodeId({ mode: 'nav', cardIndex: 2, passageIndex: 1 }),
        'search-card-2-passage-1',
    );
});
