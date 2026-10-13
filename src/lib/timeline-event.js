export const toTimelineEvent = event => {
    const timelineEvent = {...event};
    delete timelineEvent.nextSnapshot;
    delete timelineEvent.previousSnapshot;
    const timestamp = event.timestamp;

    return {
        ...timelineEvent,
        begin: timestamp,
        end: timestamp
    };
};
