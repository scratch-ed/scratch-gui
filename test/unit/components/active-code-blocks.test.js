import React from 'react';
import ReactDOM from 'react-dom';
import {act, Simulate} from 'react-dom/test-utils';
import {IntlProvider} from 'react-intl';
import renderer from 'react-test-renderer';
import ActiveCodeBlocks, {getActiveCodeThreads} from '../../../src/components/debug-timeline/active-code-blocks.jsx';

jest.mock('../../../src/components/debug-timeline/active-code-blocks.css', () => ({
    active: 'active',
    block: 'block',
    thread: 'thread'
}));

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
            hat: {
                opcode: 'event_whenflagclicked',
                next: 'move',
                inputs: {}
            },
            move: {
                opcode: 'motion_movesteps',
                next: null,
                inputs: {}
            }
        };

        expect(getActiveCodeThreads(context, 0, 'sprite', blocks)).toEqual([{
            id: 'hat',
            highlightedBlock: 'move',
            blocks: [
                {id: 'hat', opcode: 'event_whenflagclicked', category: 'event', branches: []},
                {id: 'move', opcode: 'motion_movesteps', category: 'motion', branches: []}
            ]
        }]);
    });

    test('renders nested VM substacks, both if-else branches, and the current block', () => {
        const context = {
            log: {
                snapshots: [{
                    runtimeSnapshot: {
                        threads: [JSON.stringify({
                            targetId: 'sprite',
                            topBlock: 'hat',
                            stack: ['repeat', 'condition', 'turn']
                        })]
                    }
                }, {
                    runtimeSnapshot: {
                        threads: [JSON.stringify({
                            targetId: 'sprite',
                            topBlock: 'hat',
                            stack: ['repeat', 'condition', 'move']
                        })]
                    }
                }]
            }
        };
        const targetBlocks = {
            hat: {opcode: 'event_whenflagclicked', next: 'repeat'},
            repeat: {
                opcode: 'control_repeat',
                next: 'say',
                inputs: {
                    SUBSTACK: {name: 'SUBSTACK', block: 'condition', shadow: null}
                }
            },
            condition: {
                opcode: 'control_if_else',
                next: null,
                inputs: {
                    SUBSTACK2: {name: 'SUBSTACK2', block: 'turn', shadow: null},
                    SUBSTACK: {name: 'SUBSTACK', block: 'move', shadow: null}
                }
            },
            move: {opcode: 'motion_movesteps', next: null},
            turn: {opcode: 'motion_turnright', next: null},
            say: {opcode: 'looks_say', next: null}
        };

        const thread = getActiveCodeThreads(context, 0, 'sprite', targetBlocks)[0];
        expect(thread.highlightedBlock).toBe('turn');
        expect(thread.blocks.map(block => block.id)).toEqual(['hat', 'repeat', 'say']);
        const condition = thread.blocks[1].branches[0].blocks[0];
        expect(condition.branches.map(branch => branch.name)).toEqual(['SUBSTACK', 'SUBSTACK2']);
        expect(condition.branches.map(branch => branch.blocks[0].id)).toEqual(['move', 'turn']);

        const component = renderer.create(React.createElement(
            IntlProvider,
            {locale: 'en'},
            React.createElement(ActiveCodeBlocks, {context, editingTarget: 'sprite', targetBlocks, timeFrame: 0})
        ));
        const output = JSON.stringify(component.toJSON());
        expect(output).toContain('Then');
        expect(output).toContain('Else');
        expect(output).toContain('Movesteps');
        expect(output).toContain('Turnright');
        const highlighted = component.root.findAll(node =>
            node.type === 'div' && typeof node.props.className === 'string' &&
            node.props.className.split(' ').includes('active')
        );
        expect(highlighted).toHaveLength(1);
        expect(highlighted[0].children).toEqual(['Turnright']);

        component.update(React.createElement(
            IntlProvider,
            {locale: 'en'},
            React.createElement(ActiveCodeBlocks, {context, editingTarget: 'sprite', targetBlocks, timeFrame: 1})
        ));
        const nextHighlighted = component.root.findAll(node =>
            node.type === 'div' && typeof node.props.className === 'string' &&
            node.props.className.split(' ').includes('active')
        );
        expect(nextHighlighted).toHaveLength(1);
        expect(nextHighlighted[0].children).toEqual(['Movesteps']);
    });

    test('keeps an empty else branch distinct from the then branch', () => {
        const context = {log: {snapshots: [{runtimeSnapshot: {
            threads: [JSON.stringify({targetId: 'sprite', topBlock: 'if', stack: ['if']})]
        }}]}};
        const blocks = {
            if: {
                opcode: 'control_if_else',
                next: null,
                inputs: {
                    SUBSTACK: {name: 'SUBSTACK', block: 'move', shadow: null}
                }
            },
            move: {opcode: 'motion_movesteps', next: null}
        };

        const branches = getActiveCodeThreads(context, 0, 'sprite', blocks)[0].blocks[0].branches;
        expect(branches.map(branch => [branch.name, branch.blocks.length])).toEqual([
            ['SUBSTACK', 1], ['SUBSTACK2', 0]
        ]);
    });

    test('scrolls each thread to its highlighted block and resizes the panel', () => {
        const context = {log: {snapshots: [
            {runtimeSnapshot: {threads: [
                JSON.stringify({targetId: 'sprite', topBlock: 'hat1', stack: ['move']}),
                JSON.stringify({targetId: 'sprite', topBlock: 'hat2', stack: ['say']})
            ]}},
            {runtimeSnapshot: {threads: [
                JSON.stringify({targetId: 'sprite', topBlock: 'hat1', stack: ['turn']}),
                JSON.stringify({targetId: 'sprite', topBlock: 'hat2', stack: ['say']})
            ]}}
        ]}};
        const targetBlocks = {
            hat1: {opcode: 'event_whenflagclicked', next: 'move'},
            move: {opcode: 'motion_movesteps', next: 'turn'},
            turn: {opcode: 'motion_turnright', next: null},
            hat2: {opcode: 'event_whenkeypressed', next: 'say'},
            say: {opcode: 'looks_say', next: null}
        };
        const positions = {Movesteps: [160, 180], Say: [200, 220], Turnright: [-20, 0]};
        const rect = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
            // DOM geometry depends on the element receiving the call.
            // eslint-disable-next-line no-invalid-this
            const position = positions[this.textContent] || [0, 100];
            return {top: position[0], bottom: position[1], left: 0, right: 100};
        });
        const height = jest.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(100);
        const width = jest.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(200);
        const previousResizeObserver = global.ResizeObserver;
        const observers = [];
        global.ResizeObserver = jest.fn(callback => {
            const observer = {callback, observe: jest.fn(), disconnect: jest.fn()};
            observers.push(observer);
            return observer;
        });
        const root = document.createElement('div');
        document.body.appendChild(root);
        root.scrollTop = 29;
        const renderFrame = timeFrame => React.createElement(
            IntlProvider, {locale: 'en'},
            React.createElement(ActiveCodeBlocks, {context, editingTarget: 'sprite', targetBlocks, timeFrame})
        );

        try {
            act(() => {
                ReactDOM.render(renderFrame(0), root);
            });
            const threads = root.querySelectorAll('.thread');
            expect(threads[0].scrollTop).toBe(80);
            expect(threads[1].scrollTop).toBe(120);
            expect(root.scrollTop).toBe(29);
            expect(root.querySelector('section').style.height).toBe('40%');

            positions.Say = [20, 40];
            act(() => {
                ReactDOM.render(renderFrame(1), root);
            });
            expect(threads[0].scrollTop).toBe(60);
            expect(threads[1].scrollTop).toBe(120);
            positions.Turnright = [140, 160];
            const slider = root.querySelector('input[type="range"]');
            expect(slider.min).toBe('20');
            expect(slider.max).toBe('70');
            act(() => Simulate.change(slider, {target: {value: '70'}}));
            expect(root.querySelector('section').style.height).toBe('70%');
            expect(threads[0].scrollTop).toBe(120);
            positions.Turnright = [130, 150];
            observers[observers.length - 2].callback();
            expect(threads[0].scrollTop).toBe(170);
            expect(root.scrollTop).toBe(29);
        } finally {
            ReactDOM.unmountComponentAtNode(root);
            document.body.removeChild(root);
            global.ResizeObserver = previousResizeObserver;
            rect.mockRestore();
            height.mockRestore();
            width.mockRestore();
        }
        expect(observers.every(observer => observer.disconnect.mock.calls.length === 1)).toBe(true);
    });

    test('returns no code when the selected frame has no runtime snapshot', () => {
        expect(getActiveCodeThreads({log: {snapshots: [{}]}}, 0, 'sprite', {})).toEqual([]);
    });
});
