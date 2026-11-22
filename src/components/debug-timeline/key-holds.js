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
 * @returns {{holds: Array<object>, events: Array<object>}} Holds and events to display.
 */
export const getKeyHolds = (events, activeTargetName) => {
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
        hold.inputs.slice(1).forEach(input => {
            const reacts = input.events.some(event => event.sprites.includes(activeTargetName));
            if (!reacts) hold.nonReactingRepeats++;
            input.events.forEach(event => {
                if (!event.sprites.includes(activeTargetName)) hidden.add(event);
            });
        });
    });

    // Return the repeated holds and the filtered events, excluding key transitions and hidden events.
    return {
        holds: repeatedHolds,
        events: events.filter(event =>
            event.type !== 'keyTransition' && event.type !== 'keyHistoryBoundary' && !hidden.has(event))
    };
};
