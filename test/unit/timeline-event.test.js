import {toTimelineEvent} from '../../src/lib/timeline-event.js';

test('uses the input timestamp for events without a reacting sprite', () => {
    const event = {
        type: 'key',
        timestamp: 1234,
        previousSnapshot: {timestamp: 1000},
        nextSnapshot: {timestamp: 2000}
    };

    expect(toTimelineEvent(event)).toEqual({
        type: 'key',
        timestamp: 1234,
        begin: 1234,
        end: 1234
    });
});

test('preserves the reacting snapshot position for handled events', () => {
    const event = {
        type: 'broadcast',
        timestamp: 1234,
        sprites: ['Sprite1'],
        previousSnapshot: {timestamp: 1000},
        nextSnapshot: {timestamp: 2000}
    };

    expect(toTimelineEvent(event)).toEqual({
        type: 'broadcast',
        timestamp: 1234,
        sprites: ['Sprite1'],
        begin: 1000,
        end: 1000
    });
});
