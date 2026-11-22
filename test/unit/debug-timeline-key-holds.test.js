import {getKeyHolds, getKeyRecordingEnd} from '../../src/components/debug-timeline/key-holds.js';

const transition = (key, isDown, id, timestamp) => ({
    type: 'keyTransition', data: {key, isDown, id}, timestamp
});
const reaction = (id, sprites, key = 'A') => ({
    type: 'key', data: {key}, sprites, keyInputId: id
});

test('hides only repeated nonreactions and counts physical keydowns once', () => {
    const first = reaction(1, []);
    const ignored = reaction(2, ['Other']);
    const anyReaction = reaction(2, ['Sprite'], 'any');
    const ignoredRepeat = reaction(3, []);
    const input = [
        transition('A', true, 1, 10), first,
        transition('A', true, 2, 20), ignored, anyReaction,
        transition('A', true, 3, 30), ignoredRepeat,
        transition('A', false, 4, 40)
    ];

    const result = getKeyHolds(input, 'Sprite');
    expect(result.events).toEqual([first, anyReaction]);
    expect(result.holds[0]).toMatchObject({key: 'A', start: 10, end: 40, nonReactingRepeats: 1});
    expect(getKeyHolds(input, 'Other').holds[0].nonReactingRepeats).toBe(1);
    expect(getKeyHolds(input, 'Other').events).toEqual([first, ignored]);
});

test('separates overlapping keys and consecutive holds without inferring releases', () => {
    const input = [
        transition('A', true, 1, 10), reaction(1, []),
        transition('B', true, 2, 11), reaction(2, []),
        transition('A', true, 3, 20), reaction(3, []),
        transition('A', false, 4, 21),
        transition('A', true, 5, 22), reaction(5, []),
        transition('B', true, 6, 23), reaction(6, []),
        transition('A', false, 7, 24),
        transition('C', false, 8, 25),
        {type: 'key', data: {key: 'A'}, sprites: ['Sprite']}
    ];
    const result = getKeyHolds(input, 'Sprite');
    expect(result.holds.map(({key, start, end}) => ({key, start, end}))).toEqual([
        {key: 'A', start: 10, end: 21},
        {key: 'B', start: 11, end: null}
    ]);
    expect(result.events).toHaveLength(4);
});

test('history boundaries close open holds without treating them as key releases', () => {
    const result = getKeyHolds([
        transition('A', true, 1, 10), reaction(1, []),
        transition('A', true, 2, 20), reaction(2, []),
        {type: 'keyHistoryBoundary', timestamp: 25},
        transition('A', true, 3, 30), reaction(3, [])
    ], 'Sprite');
    expect(result.holds).toHaveLength(1);
    expect(result.holds[0]).toMatchObject({start: 10, end: 25, truncated: true});
    expect(result.events).toHaveLength(2);
});

test('includes key release times after the last snapshot without creating a frame', () => {
    expect(getKeyRecordingEnd([100, 200], [
        transition('A', false, 1, 350),
        {type: 'click', timestamp: 500}
    ])).toBe(350);
});
