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
