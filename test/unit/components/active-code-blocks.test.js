import React from 'react';
import ReactDOM from 'react-dom';
import {act, Simulate} from 'react-dom/test-utils';
import {IntlProvider} from 'react-intl';
import renderer from 'react-test-renderer';
import ScratchBlocks from 'scratch-blocks';
import ActiveCodeBlocks, {getActiveCodeThreads} from '../../../src/components/debug-timeline/active-code-blocks.jsx';
import {getBlockLabels, getSnapshotReporterValue} from '../../../src/components/debug-timeline/active-code-labels';
import log from '../../../src/lib/log';

jest.mock('../../../src/components/debug-timeline/active-code-blocks.css', () => ({
    active: 'active',
    block: 'block',
    thread: 'thread',
    threadList: 'threadList',
    literalInput: 'literalInput',
    reporterInput: 'reporterInput'
}));

describe('Active code blocks', () => {
    let mainWorkspace;
    beforeEach(() => {
        mainWorkspace = ScratchBlocks.mainWorkspace;
        ScratchBlocks.mainWorkspace = {options: {pathToMedia: '/media/'}};
    });
    afterEach(() => {
        ScratchBlocks.mainWorkspace = mainWorkspace;
    });

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
        expect(output).toContain('move');
        expect(output).toContain('rotate-right.svg');
        const highlighted = component.root.findAll(node =>
            node.type === 'div' && typeof node.props.className === 'string' &&
            node.props.className.split(' ').includes('active')
        );
        expect(highlighted).toHaveLength(1);
        expect(highlighted[0].findByType('img').props.src).toContain('rotate-right.svg');

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
        expect(nextHighlighted[0].findAllByType('span').some(node => node.children.includes('move'))).toBe(true);
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

    test('uses localized Scratch labels, literal inputs, menus and nested reporters', () => {
        const blocks = {
            say: {opcode: 'looks_sayforsecs', inputs: {MESSAGE: {block: 'text'}, SECS: {block: 'add'}}},
            text: {opcode: 'text', shadow: true, fields: {TEXT: {name: 'TEXT', value: 'Hello'}}},
            add: {opcode: 'operator_add', inputs: {NUM1: {block: 'variable'}, NUM2: {block: 'number'}}},
            variable: {opcode: 'data_variable', fields: {VARIABLE: {name: 'VARIABLE', id: 'score-id', value: 'score'}}},
            number: {opcode: 'math_number', shadow: true, fields: {NUM: {name: 'NUM', value: 2}}},
            sound: {opcode: 'sound_playuntildone', inputs: {SOUND_MENU: {block: 'menu'}}},
            menu: {
                opcode: 'sound_sounds_menu',
                shadow: true,
                fields: {SOUND_MENU: {name: 'SOUND_MENU', value: 'Meow'}}
            },
            condition: {opcode: 'control_if_else', inputs: {SUBSTACK: {block: 'sound'}}},
            unknown: {opcode: 'example_unknown'}
        };
        const text = label => label.parts.map(part => {
            if (part.type === 'input') return part.label ? text(part.label) : '?';
            return part.text || '';
        }).filter(Boolean)
            .join(' ');
        const previousMessages = ScratchBlocks.Msg;
        const previousLocale = ScratchBlocks.ScratchMsgs.currentLocale_;
        const previousWorkspace = ScratchBlocks.mainWorkspace;
        const english = getBlockLabels(blocks, ['say', 'sound', 'condition', 'unknown'], 'en');
        expect(text(english.say)).toBe('say Hello for score + 2 seconds');
        expect(text(english.sound)).toBe('play sound Meow until done');
        expect(text(english.condition)).toBe('if ? then');
        expect(english.unknown.unsupported).toBe(true);
        const dutch = getBlockLabels(blocks, ['say'], 'nl');
        expect(text(dutch.say)).toBe('zeg Hello score + 2 sec.');
        expect(ScratchBlocks.Msg).toBe(previousMessages);
        expect(ScratchBlocks.ScratchMsgs.currentLocale_).toBe(previousLocale);
        expect(ScratchBlocks.mainWorkspace).toBe(previousWorkspace);
        expect(ScratchBlocks.Events.isEnabled()).toBe(true);
    });

    test('shows recorded reporter values at the selected frame without evaluating expressions', () => {
        const blocks = {
            say: {opcode: 'looks_say', inputs: {MESSAGE: {block: 'variable'}}},
            variable: {opcode: 'data_variable', fields: {VARIABLE: {name: 'VARIABLE', id: 'score-id', value: 'score'}}}
        };
        const thread = JSON.stringify({targetId: 'sprite', topBlock: 'say', stack: ['say', 'variable']});
        const makeSnapshot = value => ({
            runtimeSnapshot: {threads: [thread]},
            targets: [{id: 'sprite', variables: [{id: 'score-id', type: '', value}], x: 7}],
            stage: {id: 'stage', variables: [{id: 'global-id', type: '', value: false}]}
        });
        const first = makeSnapshot(0);
        const context = {log: {snapshots: [first, makeSnapshot(9)]}};
        expect(getSnapshotReporterValue(blocks.variable, first, 'sprite')).toBe(0);
        expect(getSnapshotReporterValue({
            opcode: 'data_variable', fields: {VARIABLE: {id: 'global-id'}}
        }, first, 'sprite')).toBe(false);
        expect(getSnapshotReporterValue({opcode: 'motion_xposition'}, first, 'sprite')).toBe(7);
        expect(getSnapshotReporterValue({opcode: 'operator_random'}, first, 'sprite')).toBeUndefined();
        expect(getSnapshotReporterValue(blocks.variable, first, 'missing')).toBeUndefined();

        const render = timeFrame => React.createElement(
            IntlProvider, {locale: 'en'},
            React.createElement(ActiveCodeBlocks, {context, editingTarget: 'sprite', targetBlocks: blocks, timeFrame})
        );
        const component = renderer.create(render(0));
        expect(JSON.stringify(component.toJSON())).toContain('at this frame: 0');
        const highlighted = component.root.findAll(node => node.type === 'span' &&
            typeof node.props.className === 'string' && node.props.className.split(' ').includes('active'));
        expect(highlighted).toHaveLength(1);
        component.update(render(1));
        expect(JSON.stringify(component.toJSON())).toContain('at this frame: 9');
        blocks.variable.fields.VARIABLE.value = 'points';
        component.update(render(1));
        expect(JSON.stringify(component.toJSON())).toContain('points');
        expect(JSON.stringify(component.toJSON())).not.toContain('score');
        component.update(React.createElement(
            IntlProvider, {
                locale: 'nl',
                messages: {
                    'gui.activeCode.focus': 'Focus',
                    'gui.activeCode.panelSize': 'Paneelgrootte',
                    'gui.activeCode.snapshotValue': '(op dit frame: {value})'
                }
            },
            React.createElement(ActiveCodeBlocks, {
                context, editingTarget: 'sprite', targetBlocks: blocks, timeFrame: 1
            })
        ));
        expect(JSON.stringify(component.toJSON())).toContain('zeg');
        expect(JSON.stringify(component.toJSON())).toContain('op dit frame: 9');

        const reporterSnapshot = makeSnapshot(0);
        reporterSnapshot.runtimeSnapshot.threads = [JSON.stringify({
            targetId: 'sprite', topBlock: 'variable', stack: ['variable']
        })];
        const reporter = renderer.create(React.createElement(
            IntlProvider, {locale: 'en'},
            React.createElement(ActiveCodeBlocks, {
                context: {log: {snapshots: [reporterSnapshot]}},
                editingTarget: 'sprite',
                targetBlocks: blocks,
                timeFrame: 0
            })
        ));
        expect(JSON.stringify(reporter.toJSON())).toContain('at this frame: 0');
    });

    test('restores Blockly state and exposes a fallback when a block definition fails', () => {
        const messages = ScratchBlocks.Msg;
        const locale = ScratchBlocks.ScratchMsgs.currentLocale_;
        const warn = jest.spyOn(log, 'warn').mockImplementation(() => {});
        const init = jest.spyOn(ScratchBlocks.Blocks.motion_movesteps, 'init').mockImplementation(() => {
            throw new Error('Unusable definition');
        });
        ScratchBlocks.Events.disable();
        try {
            const labels = getBlockLabels({move: {opcode: 'motion_movesteps'}}, ['move'], 'nl');
            expect(labels.move.unsupported).toBe(true);
            expect(warn).toHaveBeenCalled();
            expect(ScratchBlocks.Msg).toBe(messages);
            expect(ScratchBlocks.ScratchMsgs.currentLocale_).toBe(locale);
            expect(ScratchBlocks.Events.isEnabled()).toBe(false);
        } finally {
            ScratchBlocks.Events.enable();
            init.mockRestore();
            warn.mockRestore();
        }
    });

    test('renders threads without fixed groups and focuses every thread', () => {
        const targetBlocks = {};
        const threads = Array.from({length: 7}, (unused, index) => {
            const id = `block-${index}`;
            targetBlocks[id] = {opcode: 'motion_movesteps', next: null};
            return JSON.stringify({targetId: 'sprite', topBlock: id, stack: [id]});
        });
        const context = {log: {snapshots: [{runtimeSnapshot: {threads}}]}};
        const rect = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
            // eslint-disable-next-line no-invalid-this
            const active = this.classList.contains('active');
            return {top: active ? 160 : 0, bottom: active ? 180 : 100};
        });
        const height = jest.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(100);
        const root = document.createElement('div');
        document.body.appendChild(root);

        try {
            act(() => {
                ReactDOM.render(React.createElement(
                    IntlProvider, {locale: 'en'},
                    React.createElement(ActiveCodeBlocks, {
                        context, editingTarget: 'sprite', targetBlocks, timeFrame: 0
                    })
                ), root);
            });
            expect(root.querySelectorAll('.threadList > .thread')).toHaveLength(7);
            const elements = root.querySelectorAll('.thread');
            elements.forEach(element => {
                element.scrollTop = 0;
            });
            act(() => Simulate.click(root.querySelector('button')));
            expect(Array.from(elements, element => element.scrollTop)).toEqual([80, 80, 80, 80, 80, 80, 80]);
        } finally {
            ReactDOM.unmountComponentAtNode(root);
            document.body.removeChild(root);
            rect.mockRestore();
            height.mockRestore();
        }
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
        const positions = {move: [160, 180], say: [200, 220], turn: [-20, 0]};
        const rect = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
            // DOM geometry depends on the element receiving the call.
            // eslint-disable-next-line no-invalid-this
            const key = this.classList.contains('active') &&
                // eslint-disable-next-line no-invalid-this
                Object.keys(positions).find(name => this.textContent.includes(name));
            const position = positions[key] || [0, 100];
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

            positions.say = [20, 40];
            act(() => {
                ReactDOM.render(renderFrame(1), root);
            });
            expect(threads[0].scrollTop).toBe(60);
            expect(threads[1].scrollTop).toBe(120);
            positions.turn = [140, 160];
            const slider = root.querySelector('input[type="range"]');
            expect(slider.min).toBe('32');
            expect(slider.max).toBe('72');
            act(() => Simulate.change(slider, {target: {value: '72'}}));
            expect(root.querySelector('section').style.height).toBe('72%');
            expect(threads[0].scrollTop).toBe(120);
            positions.turn = [130, 150];
            observers[observers.length - 2].callback();
            expect(threads[0].scrollTop).toBe(170);
            threads[0].scrollTop = 0;
            threads[1].scrollTop = 0;
            positions.turn = [140, 160];
            positions.say = [150, 170];
            const focusButton = root.querySelector('button');
            expect(focusButton.textContent).toBe('');
            expect(focusButton.getAttribute('title')).toBe('Focus on highlighted blocks');
            expect(focusButton.getAttribute('aria-label')).toBe('Focus on highlighted blocks');
            expect(focusButton.querySelector('img')).not.toBeNull();
            expect(focusButton.compareDocumentPosition(slider) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
            act(() => Simulate.click(focusButton));
            expect(threads[0].scrollTop).toBe(60);
            expect(threads[1].scrollTop).toBe(70);
            act(() => Simulate.click(focusButton));
            expect(threads[0].scrollTop).toBe(120);
            expect(threads[1].scrollTop).toBe(140);
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
