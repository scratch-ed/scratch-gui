import React from 'react';
import {shallow} from 'enzyme';
import VM from 'scratch-vm';
import ConnectedDebugTimeline from '../../src/components/debug-timeline/debug-timeline.jsx';
import Category from '../../src/components/debug-timeline/category.jsx';
import EventsBarRow from '../../src/components/debug-timeline/events-bar-row.jsx';
import KeySelector from '../../src/components/debug-timeline/key-selector.jsx';
import Row from '../../src/components/debug-timeline/row.jsx';

jest.mock('scratch-vm', () => class VirtualMachine {});
jest.mock('../../src/components/debug-timeline/constants.ts', () => ({
    BAR_WIDTH: 80,
    SUB_BAR_NUM: 4,
    TRACK_HEIGHT: 80,
    EVENT_TYPES: {EVENTS: 0, KEY: 2},
    EVENT_INFO: {
        events: {id: 0, name: 'Events', color: 'events', icon: 'events'},
        event_whenkeypressed: {id: 2, name: 'Key pressed', color: 'broadcast', icon: 'key'}
    }
}));
jest.mock('../../src/components/debug-timeline/helpers.ts', () => ({
    getCompressedPlotPosition: () => 40,
    getKeyOnIcon: key => key
}));

const transition = (key, isDown, id, timestamp) => ({
    type: 'keyTransition', data: {key, isDown, id}, timestamp, begin: timestamp
});
const reaction = (key, id, sprites, timestamp) => ({
    type: 'key', data: {key}, sprites, keyInputId: id, begin: timestamp, timestamp
});

test('filters red-only lanes and combines or separates visible key holds', () => {
    const events = [
        transition('A', true, 1, 10), reaction('A', 1, ['Sprite'], 10),
        transition('B', true, 2, 20), reaction('B', 2, [], 20),
        transition('A', true, 3, 30), reaction('A', 3, [], 30),
        transition('B', true, 4, 40), reaction('B', 4, [], 40),
        {type: 'click', data: {}, sprites: [], begin: 50}
    ];
    const DebugTimeline = ConnectedDebugTimeline.WrappedComponent;
    const props = {
        vm: new VM(),
        activeThreads: new Map(),
        zoomLevel: 1,
        timeFrame: 0,
        editingTarget: 'sprite',
        sprites: {sprite: {name: 'Sprite'}},
        stage: {id: 'stage', name: 'Stage'},
        timestamps: [0, 100],
        events: events,
        visibleKeys: ['any'],
        onSetVisibleKeys: jest.fn()
    };
    const timeline = shallow(<DebugTimeline {...props} />);
    expect(timeline.find(KeySelector)).toHaveLength(1);
    expect(timeline.find(Category).prop('categories')
        .map(category => category.name)).toEqual(['Events']);
    expect(timeline.find(Category).prop('eventKeys')).toEqual(['a', 'b']);
    expect(timeline.find(Row).filterWhere(row => row.prop('compact'))).toHaveLength(2);
    expect(timeline.find(EventsBarRow)).toHaveLength(3);
    const rows = timeline.find(EventsBarRow);
    expect(rows.at(0).prop('events')).toEqual([events[8]]);
    expect(rows.at(1).prop('holds')[0].reacts).toBe(true);
    expect(rows.at(2).prop('holds')[0].reacts).toBe(false);
    timeline.find(KeySelector).prop('onShowRedHoldsChange')({target: {checked: false}});
    expect(timeline.find(EventsBarRow).at(1)
        .prop('holds')).toHaveLength(1);
    expect(timeline.find(Category).prop('eventKeys')).toEqual(['a']);
    expect(timeline.find(EventsBarRow)).toHaveLength(2);
    expect(timeline.find(EventsBarRow).at(0)
        .prop('events')).toEqual([events[8]]);
    timeline.find(KeySelector).prop('onShowSeparateChange')({target: {checked: false}});
    expect(timeline.find(Category).prop('eventKeys')).toEqual([]);
    expect(timeline.find(EventsBarRow)).toHaveLength(1);
    expect(timeline.find(EventsBarRow).prop('holds')).toHaveLength(1);
    expect(timeline.find(EventsBarRow).prop('events')).toContain(events[1]);
    timeline.find(KeySelector).prop('onShowSeparateChange')({target: {checked: true}});
    timeline.setProps({
        editingTarget: 'other',
        sprites: {sprite: {name: 'Sprite'}, other: {name: 'Other'}}
    });
    expect(timeline.find(EventsBarRow)).toHaveLength(1);
    timeline.setProps({editingTarget: 'sprite'});
    timeline.find(KeySelector).prop('onShowRedHoldsChange')({target: {checked: true}});
    expect(timeline.find(EventsBarRow).at(2)
        .prop('holds')).toHaveLength(1);
    timeline.setProps({visibleKeys: ['b']});
    expect(timeline.find(EventsBarRow)).toHaveLength(2);
    expect(timeline.find(EventsBarRow).at(1)
        .prop('holds')[0].key).toBe('B');
});

test('retains a key lane containing green holds when red holds for that key are hidden', () => {
    const events = [
        transition('A', true, 1, 10), reaction('A', 1, [], 10),
        transition('A', true, 2, 20), transition('A', false, 3, 25),
        transition('A', true, 4, 30), reaction('A', 4, ['Sprite'], 30),
        transition('A', true, 5, 40), transition('A', false, 6, 50)
    ];
    const timeline = shallow(<ConnectedDebugTimeline.WrappedComponent
        vm={new VM()}
        activeThreads={new Map()}
        zoomLevel={1}
        timeFrame={0}
        editingTarget="sprite"
        sprites={{sprite: {name: 'Sprite'}}}
        stage={{id: 'stage', name: 'Stage'}}
        timestamps={[0, 100]}
        events={events}
        visibleKeys={['any']}
        onSetVisibleKeys={jest.fn()}
    />);
    timeline.find(KeySelector).prop('onShowRedHoldsChange')({target: {checked: false}});
    expect(timeline.find(Category).prop('eventKeys')).toEqual(['a']);
    expect(timeline.find(EventsBarRow).at(1)
        .prop('holds')).toHaveLength(1);
    expect(timeline.find(EventsBarRow).at(1)
        .prop('events')).toEqual([events[5]]);
});
