/**
 * Determines if a timeline event is visible.
 * @param {object} event - The timeline event to check.
 * @returns {boolean} - True if the event is visible, false otherwise.
 */
export const isVisibleTimelineEvent = event => {
    if (event.type === 'say' || event.type === 'sound') {
        return false;
    }
    if (event.type === 'renderer' && event.data &&
        ['createTextSkin', 'updateTextSkin', 'destroySkin'].includes(event.data.name)) {
        return false;
    }
    return true;
};

export const toTimelineEvent = event => {
    const timelineEvent = {...event};
    delete timelineEvent.nextSnapshot;
    delete timelineEvent.previousSnapshot;
    const previousSnapshot = event.previousSnapshot;
    const hasReactingSprites = Array.isArray(event.sprites) && event.sprites.length > 0;
    const begin = hasReactingSprites && previousSnapshot ?
        previousSnapshot.timestamp : // Use the previous snapshot timestamp for events with reacting sprites
        event.timestamp; // Use the original event timestamp for unanswered input events

    return {
        ...timelineEvent,
        begin: begin,
        end: begin
    };
};
