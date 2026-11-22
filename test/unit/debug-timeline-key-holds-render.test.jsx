import React from 'react';
import {shallow} from 'enzyme';
import EventsBarRow from '../../src/components/debug-timeline/events-bar-row.jsx';
import Event from '../../src/components/debug-timeline/event.jsx';
import GapTooltip from '../../src/components/debug-timeline/gap-tooltip.jsx';

jest.mock('../../src/components/debug-timeline/constants.ts', () => ({
    BAR_WIDTH: 80,
    EVENTS_TO_ICON: {key: 'key'},
    EVENT_TYPES: {KEY: 2}
}));
jest.mock('../../src/components/debug-timeline/helpers.ts', () => ({
    getCompressedPlotPosition: () => 40,
    getKeyOnIcon: key => key
}));

test('renders hold reactions in a compressed gap while retaining unrelated gap events', () => {
    const events = [
        {type: 'keyTransition', data: {key: 'A', isDown: true, id: 1}, timestamp: 100},
        {type: 'key', data: {key: 'A'}, sprites: [], keyInputId: 1, begin: 100},
        {type: 'keyTransition', data: {key: 'A', isDown: true, id: 2}, timestamp: 500},
        {type: 'key', data: {key: 'A'}, sprites: ['Sprite'], keyInputId: 2, begin: 500},
        {type: 'keyTransition', data: {key: 'A', isDown: true, id: 3}, timestamp: 600},
        {type: 'key', data: {key: 'A'}, sprites: [], keyInputId: 3, begin: 600},
        {type: 'click', data: {}, sprites: [], begin: 700},
        {type: 'keyTransition', data: {key: 'A', isDown: false, id: 4}, timestamp: 800}
    ];
    const isGap = jest.fn().mockReturnValue(true);
    const row = shallow(
        <EventsBarRow
            activeTargetName="Sprite"
            events={events}
            isGap={isGap}
            tickSize={100}
            timeTicks={[0, 1000]}
            timestampEnd={800}
        />
    );
    expect(row.find('button').prop('title')).toContain('released at 800 ms');
    expect(row.find('button').prop('title')).toContain('1 repeated keydown(s) did not start Sprite');
    expect(row.find(Event)).toHaveLength(1);
    expect(row.find(Event).prop('event')).toBe(events[3]);
    expect(row.find(GapTooltip).prop('gapGroup').events).toEqual([events[1], events[6]]);
});
