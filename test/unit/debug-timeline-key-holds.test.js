import {getKeyHolds, getKeyLanes, getKeyRecordingEnd} from '../../src/components/debug-timeline/key-holds.js';

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
    expect(result.holds[0].reacts).toBe(true);
    expect(getKeyHolds(input, 'Other').holds[0].nonReactingRepeats).toBe(1);
    expect(getKeyHolds(input, 'Other').events).toEqual([first, ignored]);
});

test('colors each hold by all reactions for the currently selected target', () => {
    const input = [
        transition('A', true, 1, 0), reaction(1, ['Sprite'], 'any'),
        transition('A', true, 2, 10), reaction(2, ['Other']),
        transition('A', false, 3, 20),
        transition('A', true, 4, 30), reaction(4, ['Other']),
        transition('A', true, 5, 40), reaction(5, []),
        transition('A', false, 6, 50)
    ];
    expect(getKeyHolds(input, 'Sprite').holds.map(hold => hold.reacts)).toEqual([true, false]);
    expect(getKeyHolds(input, 'Other').holds.map(hold => hold.reacts)).toEqual([true, true]);
});

test('filters by physical key even when hats say any and excludes unsupported keys', () => {
    const aFirst = reaction(1, [], 'A');
    const aAny = reaction(2, ['Sprite'], 'any');
    const bTap = reaction(3, ['Sprite'], 'any');
    const unsupported = reaction(4, ['Sprite'], 'any');
    const unknownAny = reaction(100, ['Sprite'], 'any');
    const unknownKey = reaction(101, ['Sprite'], 'enter');
    const unrelated = {type: 'click', sprites: [], data: {}};
    const input = [
        transition('A', true, 1, 0), aFirst,
        transition('A', true, 2, 10), aAny,
        transition('B', true, 3, 11), bTap,
        transition('enter', true, 4, 12), unsupported,
        transition('enter', true, 5, 13), reaction(5, []),
        unknownAny, unknownKey, unrelated
    ];
    const selected = getKeyHolds(input, 'Sprite', ['a']);
    expect(selected.holds.map(hold => hold.key)).toEqual(['A']);
    expect(selected.events).toEqual([aFirst, aAny, unknownAny, unknownKey, unrelated]);
    const none = getKeyHolds(input, 'Sprite', []);
    expect(none.holds).toEqual([]);
    expect(none.events).toEqual([unknownAny, unknownKey, unrelated]);
    expect(getKeyHolds(input, 'Sprite').events).not.toContain(unsupported);
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

test('places overlapping holds in distinct lanes and leaves short taps and unrelated events in the general row', () => {
    const aFirst = reaction(1, ['Sprite']);
    const bFirst = reaction(2, [], 'B');
    const bReact = reaction(4, ['Sprite'], 'any');
    const tap = reaction(5, [], 'C');
    const click = {type: 'click', data: {}, sprites: []};
    const input = [
        transition('A', true, 1, 0), aFirst,
        transition('B', true, 2, 1), bFirst,
        transition('A', true, 3, 10), reaction(3, []),
        transition('B', true, 4, 11), bReact,
        transition('C', true, 5, 12), tap,
        click
    ];
    const {holds, events} = getKeyHolds(input, 'Sprite');
    const {lanes, generalEvents} = getKeyLanes(holds, events);
    expect(lanes.map(lane => lane.key)).toEqual(['a', 'b']);
    expect(lanes[0].events).toEqual([aFirst]);
    expect(lanes[1].events).toEqual([bFirst, bReact]);
    expect(generalEvents).toEqual([tap, click]);
});
