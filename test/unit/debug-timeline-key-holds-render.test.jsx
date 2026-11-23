import React from 'react';
import {shallow} from 'enzyme';
import EventsBarRow from '../../src/components/debug-timeline/events-bar-row.jsx';
import Event from '../../src/components/debug-timeline/event.jsx';
import GapTooltip from '../../src/components/debug-timeline/gap-tooltip.jsx';
import {getKeyHolds, prepareKeyHoldDisplay} from '../../src/components/debug-timeline/key-holds.js';

jest.mock('../../src/components/debug-timeline/constants.ts', () => ({
    BAR_WIDTH: 80,
    EVENTS_TO_ICON: {key: 'key'},
    EVENT_TYPES: {KEY: 2}
}));
jest.mock('../../src/components/debug-timeline/helpers.ts', () => ({
    getCompressedPlotPosition: () => 40,
    getKeyOnIcon: key => key
}));
jest.mock('../../src/components/debug-timeline/debug-timeline.css', () => ({
    keyHold: 'keyHold',
    keyHoldReacted: 'keyHoldReacted',
    keyHoldUnreacted: 'keyHoldUnreacted'
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
    const {holds, events: visible} = getKeyHolds(events, 'Sprite');
    const row = shallow(
        <EventsBarRow
            activeTargetName="Sprite"
            events={visible}
            holds={holds}
            isGap={isGap}
            tickSize={100}
            timeTicks={[0, 1000]}
            timestampEnd={800}
        />
    );
    expect(row.find('button').prop('title')).toContain('released at 800 ms');
    expect(row.find('button').prop('className')).toContain('keyHoldReacted');
    expect(row.find('button').prop('title')).toContain('1 repeated keydown(s) did not start Sprite');
    expect(row.find(Event)).toHaveLength(1);
    expect(row.find(Event).prop('event')).toBe(events[3]);
    expect(row.find(GapTooltip).prop('gapGroup').events).toEqual([events[1], events[6]]);
});

test('describes a nonreacting hold as red status for the selected sprite', () => {
    const events = [
        {type: 'keyTransition', data: {key: 'B', isDown: true, id: 1}, timestamp: 100},
        {type: 'key', data: {key: 'B'}, sprites: ['Other'], keyInputId: 1, begin: 100},
        {type: 'keyTransition', data: {key: 'B', isDown: true, id: 2}, timestamp: 200},
        {type: 'key', data: {key: 'B'}, sprites: [], keyInputId: 2, begin: 200}
    ];
    const {holds, events: visible} = getKeyHolds(events, 'Sprite');
    const isGap = jest.fn().mockReturnValue(false);
    const row = shallow(
        <EventsBarRow
            activeTargetName="Sprite"
            events={visible}
            holds={holds}
            isGap={isGap}
            tickSize={100}
            timeTicks={[0, 100, 200]}
            timestampEnd={200}
        />
    );
    expect(row.find('button').prop('title')).toContain('did not start a thread for Sprite');
    expect(row.find('button').prop('className')).toContain('keyHoldUnreacted');
});

test('collapses contained holds into gap counts of physical inputs, not hat events', () => {
    const events = [
        {type: 'keyTransition', data: {key: 'A', isDown: true, id: 1}, timestamp: 100},
        {type: 'key', data: {key: 'A'}, sprites: [], keyInputId: 1, begin: 100},
        {type: 'key', data: {key: 'any'}, sprites: [], keyInputId: 1, begin: 100},
        {type: 'keyTransition', data: {key: 'A', isDown: true, id: 2}, timestamp: 200},
        {type: 'key', data: {key: 'A'}, sprites: [], keyInputId: 2, begin: 200},
        {type: 'keyTransition', data: {key: 'A', isDown: false, id: 3}, timestamp: 300},
        {type: 'click', data: {}, sprites: [], begin: 400}
    ];
    const recorded = getKeyHolds(events, 'Sprite');
    const isGap = jest.fn().mockReturnValue(true);
    const display = prepareKeyHoldDisplay(recorded.holds, recorded.events, true, [0, 1000], 100, isGap, 900);
    expect(display.holds).toEqual([]);
    expect(display.events).toHaveLength(2);
    expect(display.events[1]).toMatchObject({type: 'key', data: {key: 'A'}, gapCount: 2});
    const row = shallow(<EventsBarRow
        activeTargetName="Sprite"
        events={display.events}
        holds={display.holds}
        isGap={isGap}
        tickSize={100}
        timeTicks={[0, 1000]}
        timestampEnd={900}
    />);
    expect(row.find('button')).toHaveLength(0);
    const tooltip = shallow(<GapTooltip gapGroup={row.find(GapTooltip).prop('gapGroup')} />);
    expect(tooltip.text()).toContain('There are 3 events');
    expect(tooltip.text()).toContain('2 times');
    const hidden = prepareKeyHoldDisplay(recorded.holds, recorded.events, false, [0, 1000], 100, isGap, 900);
    expect(hidden.events).toEqual([events[6]]);
});

test('preserves holds touching or crossing gaps and handles open and truncated holds', () => {
    const input = {id: 1, events: []};
    const hold = {key: 'A', start: 100, end: 300, inputs: [input, input], reacts: true};
    const prepare = (value, end = 900) =>
        prepareKeyHoldDisplay([value], [], true, [0, 1000, 2000], 100, () => true, end);
    expect(prepare({...hold, start: 0}).holds).toHaveLength(1);
    expect(prepare({...hold, end: 1000}).holds).toHaveLength(1);
    expect(prepare({...hold, end: 1100}).holds).toHaveLength(1);
    expect(prepare({...hold, end: null}, 900).events[0].gapCount).toBe(2);
    expect(prepare({...hold, end: null}, 1000).holds).toHaveLength(1);
    expect(prepare({...hold, end: 300, truncated: true}).events[0].gapCount).toBe(2);
});
