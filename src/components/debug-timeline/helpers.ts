import {BAR_WIDTH} from './constants.ts';

export const getKeyOnIcon = (key) => {
    key = key.toUpperCase();
    switch (key) {
    case 'SPACE':
        return ' ';
    case 'LEFT ARROW':
        return '⬅';
    case 'RIGHT ARROW':
        return '➡';
    case 'UP ARROW':
        return '⬆';
    case 'DOWN ARROW':
        return '⬇';
    case 'ANY':
        return '?';
    default:
        return key;
    }
};

export const getCompressedPlotPosition = (timestamp, ticks, size) => {
    if (ticks.length < 2 || timestamp < ticks[0]) return 0;

    let visibleTimeElapsed = 0;

    let spanFound = false;
    let i = 0;
    while (!spanFound && i < ticks.length - 1 && ticks[i] < timestamp) {
        const startCut = ticks[i];
        const endCut = ticks[i + 1];

        if (timestamp >= endCut) {
            visibleTimeElapsed += size;
        } else {
            let timeIntoSpan = 0;
            if ((endCut - startCut) - size < 1e-6) {
                timeIntoSpan = timestamp - startCut;
            } else {
                timeIntoSpan = size / 2;
            }

            visibleTimeElapsed += timeIntoSpan;

            spanFound = true;
        }

        i++;
    }

    return (visibleTimeElapsed * BAR_WIDTH) / size;
};
