import React from 'react';
import {mount, shallow} from 'enzyme';
import KeySelector from '../../src/components/debug-timeline/key-selector.jsx';
import {KEY_OPTIONS, getSelectableKey, toggleSelectedKey} from '../../src/components/debug-timeline/key-options.js';
import reducer, {closeSlider, setVisibleKeys, startDebugging, timeSliderInitialState} from
'../../src/reducers/time-slider.js';

test('uses Scratch physical options and normalizes VM keys', () => {
    expect(KEY_OPTIONS).toHaveLength(41);
    expect(getSelectableKey('A')).toBe('a');
    expect(getSelectableKey('space')).toBe('space');
    expect(getSelectableKey('left arrow')).toBe('left arrow');
    expect(getSelectableKey('enter')).toBeNull();
});

test('any and individual keys are exclusive and the selection persists across recordings', () => {
    expect(toggleSelectedKey(['any'], 'a')).toEqual(['a']);
    expect(toggleSelectedKey(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleSelectedKey(['a', 'b'], 'any')).toEqual(['any']);
    expect(toggleSelectedKey(['any'], 'any')).toEqual([]);
    let state = reducer(timeSliderInitialState, setVisibleKeys(['a', 'b']));
    state = reducer(state, closeSlider());
    state = reducer(state, startDebugging());
    expect(state.visibleKeys).toEqual(['a', 'b']);
});

test('selector exposes individual options and updates exclusive any selection', () => {
    const onChange = jest.fn();
    const selector = shallow(
        <KeySelector
            selectedKeys={['any']}
            onChange={onChange}
            showRedHolds
            onShowRedHoldsChange={jest.fn()}
            showSeparate
            onShowSeparateChange={jest.fn()}
        />
    );
    expect(selector.find('input')).toHaveLength(44);
    expect(selector.find('input').at(0)
        .prop('checked')).toBe(true);
    selector.find('input').at(8)
        .simulate('change', {target: {value: 'a'}});
    expect(onChange).toHaveBeenCalledWith(['a']);
});

test('closes on an outside click or Escape, but not inside', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const selector = mount(<KeySelector
        selectedKeys={['any']}
        onChange={jest.fn()}
        showRedHolds
        onShowRedHoldsChange={jest.fn()}
        showSeparate
        onShowSeparateChange={jest.fn()}
    />, {attachTo: host});
    const details = selector.find('details').getDOMNode();
    details.open = true;
    details.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    expect(details.open).toBe(true);
    document.body.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    expect(details.open).toBe(false);
    details.open = true;
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    expect(details.open).toBe(false);
    selector.unmount();
    document.body.removeChild(host);
    await new Promise(resolve => setTimeout(resolve, 10));
});
