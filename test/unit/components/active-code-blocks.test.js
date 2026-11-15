import {getActiveCodeThreads} from '../../../src/components/debug-timeline/active-code-blocks.jsx';

describe('Active code blocks', () => {
    test('returns selected target stacks and the block highlighted in the frame', () => {
        const context = {
            log: {
                snapshots: [{
                    runtimeSnapshot: {
                        threads: [
                            JSON.stringify({
                                targetId: 'sprite',
                                topBlock: 'hat',
                                stack: ['hat', 'move'],
                                blockGlowInFrame: 'hat'
                            }),
                            JSON.stringify({
                                targetId: 'other-sprite',
                                topBlock: 'other-hat',
                                stack: ['other-hat'],
                                blockGlowInFrame: 'other-hat'
                            })
                        ]
                    }
                }]
            }
        };
        const blocks = {
            hat: {opcode: 'event_whenflagclicked'},
            move: {opcode: 'motion_movesteps'}
        };

        expect(getActiveCodeThreads(context, 0, 'sprite', blocks)).toEqual([{
            id: 'hat',
            highlightedBlock: 'move',
            blocks: [
                {id: 'hat', opcode: 'event_whenflagclicked', category: 'event'},
                {id: 'move', opcode: 'motion_movesteps', category: 'motion'}
            ]
        }]);
    });

    test('returns no code when the selected frame has no runtime snapshot', () => {
        expect(getActiveCodeThreads({log: {snapshots: [{}]}}, 0, 'sprite', {})).toEqual([]);
    });
});
