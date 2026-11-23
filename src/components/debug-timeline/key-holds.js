import {getSelectableKey, isKeySelected} from './key-options.js';
import {getCompressedGap} from './gap-utils.js';

/**
 * Find the latest recorded snapshot or keyboard transition.
 * @param {Array<number>} timestamps Snapshot timestamps.
 * @param {Array<object>} events Timeline events.
 * @returns {number} Latest recorded time in milliseconds.
 */
export const getKeyRecordingEnd = (timestamps, events) => events.reduce((latest, event) => (
    event.type === 'keyTransition' ? Math.max(latest, event.timestamp) : latest
), timestamps[timestamps.length - 1] || 0);

/**
 * Derive key holds and visible events from recorded input transitions.
 * Counts refer to physical repeated keydowns that did not start the selected target.
 * @param {Array<object>} events Timeline events in recording order.
 * @param {string} activeTargetName Currently selected sprite or stage.
 * @param {Array<string>} selectedKeys Selected physical keys or "any".
 * @returns {{holds: Array<object>, events: Array<object>}} Holds and events to display.
 */
export const getKeyHolds = (events, activeTargetName, selectedKeys = ['any']) => {
    const active = new Map();
    const inputs = new Map();
    const holds = [];

    // Find key holds
    events.forEach(event => {
        // Handle key history boundary events to close all active holds
        if (event.type === 'keyHistoryBoundary') {
            active.forEach(hold => {
                hold.end = event.timestamp;
                hold.truncated = true;
            });
            active.clear();
            return;
        }
        // Skip any events that are not key transitions.
        if (event.type !== 'keyTransition') return;
        const {key, isDown, id} = event.data;
        if (isDown) {
            // Handle key press events by creating or updating the corresponding hold for the active target.
            let hold = active.get(key);
            if (!hold) {
                hold = {key: key, start: event.timestamp, end: null, inputs: []};
                active.set(key, hold);
                holds.push(hold);
            }
            const input = {id: id, events: [], hold: hold};
            hold.inputs.push(input);
            inputs.set(id, input);
        } else {
            // Handle key release events by closing the corresponding hold if it exists.
            const hold = active.get(key);
            if (hold) {
                hold.end = event.timestamp;
                active.delete(key);
            }
        }
    });

    // Associate key input events with their corresponding holds
    events.forEach(event => {
        const input = inputs.get(event.keyInputId);
        if (event.type === 'key' && input) input.events.push(event);
    });

    // Determine which events should be hidden based on non-reacting repeats
    const hidden = new Set();
    const repeatedHolds = holds.filter(hold => hold.inputs.length > 1);
    repeatedHolds.forEach(hold => {
        hold.nonReactingRepeats = 0;
        hold.reacts = hold.inputs.some(input =>
            input.events.some(event => event.sprites.includes(activeTargetName))
        );
        hold.inputs.slice(1).forEach(input => {
            const reacts = input.events.some(event => event.sprites.includes(activeTargetName));
            if (!reacts) hold.nonReactingRepeats++;
            input.events.forEach(event => {
                if (!event.sprites.includes(activeTargetName)) hidden.add(event);
            });
        });
    });

    // Filter by the originating physical key, rather than the "any" hat label.
    const isVisibleEvent = event => {
        if (event.type === 'keyTransition' || event.type === 'keyHistoryBoundary' || hidden.has(event)) return false;
        if (event.type !== 'key') return true;
        const input = inputs.get(event.keyInputId);
        const key = input ? getSelectableKey(input.hold.key) : getSelectableKey(event.data.key);
        // Unassociated events with unknown keys cannot be assigned to a physical-key filter.
        return key === null ? !input :
            isKeySelected(key, selectedKeys);
    };

    return {
        holds: repeatedHolds.filter(hold => isKeySelected(getSelectableKey(hold.key), selectedKeys)),
        events: events.filter(isVisibleEvent)
    };
};

/**
 * Assign hold events to their physical-key lanes without duplicating markers.
 * @param {Array<object>} holds Selected repeated holds.
 * @param {Array<object>} events Visible timeline events.
 * @returns {{lanes: Array<object>, generalEvents: Array<object>}} Ordered lanes and remaining events.
 */
export const getKeyLanes = (holds, events) => {
    const laneMap = new Map();
    const eventKeys = new Map();
    // Map each hold to its corresponding physical key lane and track event-to-key associations.
    holds.forEach(hold => {
        const key = getSelectableKey(hold.key);
        if (!laneMap.has(key)) laneMap.set(key, {key: key, holds: [], events: []});
        laneMap.get(key).holds.push(hold);
        hold.inputs.forEach(input => input.events.forEach(event => eventKeys.set(event, key)));
    });
    // Assign events to their corresponding lanes based on the tracked event-to-key associations.
    const generalEvents = [];
    events.forEach(event => {
        if (eventKeys.has(event)) {
            laneMap.get(eventKeys.get(event)).events.push(event);
        } else {
            generalEvents.push(event);
        }
    });
    return {lanes: Array.from(laneMap.values()), generalEvents: generalEvents};
};

/**
 * Filter red holds and aggregate holds entirely inside a compressed gap.
 * @param {Array<object>} holds Selected repeated holds.
 * @param {Array<object>} events Visible events before hold filtering.
 * @param {boolean} showRedHolds Whether to show nonreacting holds.
 * @param {Array<number>} timeTicks Timeline cuts.
 * @param {number} tickSize Normal tick duration.
 * @param {Function} isGap Compressed gap predicate.
 * @param {number} timestampEnd Current recording end for open holds.
 * @returns {{holds: Array<object>, events: Array<object>}} Display holds and gap events.
 */
export const prepareKeyHoldDisplay = (holds, events, showRedHolds, timeTicks, tickSize, isGap, timestampEnd) => {
    const suppressedEvents = new Set();
    const visibleHolds = [];
    const collapsedEvents = [];
    // Process each hold to determine visibility and collapse status.
    holds.forEach(hold => {
        const hidden = !showRedHolds && !hold.reacts;
        const gap = getCompressedGap(hold.start, timeTicks, tickSize, isGap);
        const end = hold.end === null ? timestampEnd : hold.end;
        const collapsed = gap && end < gap.end;
        if (hidden || collapsed) {
            // Suppress events for hidden or collapsed holds
            hold.inputs.forEach(input => input.events.forEach(event => suppressedEvents.add(event)));
            if (!hidden) {
                collapsedEvents.push({
                    type: 'key',
                    data: {key: hold.key},
                    sprites: [],
                    begin: hold.start,
                    gapCount: hold.inputs.length
                });
            }
        } else {
            visibleHolds.push(hold);
        }
    });
    return {
        holds: visibleHolds,
        events: events.filter(event => !suppressedEvents.has(event)).concat(collapsedEvents)
    };
};
