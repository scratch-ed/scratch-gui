import {toTimelineEvent} from '../../src/lib/timeline-event.js';

test('uses the input event timestamp for live and finalized timeline events', () => {
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
