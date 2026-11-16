import {renderNativeScript} from '../../../src/components/debug-timeline/native-script';

jest.mock('../../../src/components/debug-timeline/helpers.ts', () => ({
    getKeyOnIcon: key => {
        if (key === 'left arrow') return '⬅';
        return key.toUpperCase();
    }
}));

/**
 * Create a Scratch Blocks test fixture with an existing editor workspace.
 * @returns {object} The renderer, workspace and editor state.
 */
const createFixture = () => {
    const namespace = 'http://www.w3.org/2000/svg';
    const editor = {options: {pathToMedia: '/media/', RTL: false}};
    const svg = document.createElementNS(namespace, 'svg');
    svg.appendChild(document.createElementNS(namespace, 'defs'));
    const root = document.createElementNS(namespace, 'g');
    root.setAttribute('data-id', 'hat');
    root.setAttribute('transform', 'translate(50,50)');
    root.getBBox = () => ({x: 0, y: -16, width: 200, height: 100});
    const workspace = {
        getBlockById: jest.fn(() => ({getSvgRoot: () => root})),
        getParentSvg: () => svg,
        dispose: jest.fn()
    };
    const blocks = {
        mainWorkspace: editor,
        Msg: {text: 'original'},
        ScratchMsgs: {currentLocale_: 'en', locales: {nl: {}, en: {}}, setLocale: jest.fn()},
        Field: {cacheReference_: 1, stopCache: jest.fn()},
        Events: {disable: jest.fn(), enable: jest.fn()},
        Xml: {textToDom: jest.fn(xml => xml), domToWorkspace: jest.fn()}
    };
    blocks.Field.stopCache.mockImplementation(() => {
        blocks.Field.cacheReference_--;
    });
    blocks.inject = jest.fn(() => {
        blocks.mainWorkspace = workspace;
        blocks.Field.cacheReference_++;
        return workspace;
    });
    blocks.ScratchMsgs.setLocale.mockImplementation(locale => {
        blocks.ScratchMsgs.currentLocale_ = locale;
        blocks.Msg = {text: locale};
    });
    return {blocks, editor, workspace};
};

describe('Native Scratch script rendering', () => {
    test('copies the native SVG and restores the editor globals and cache', () => {
        const {blocks, editor, workspace} = createFixture();
        const messages = blocks.Msg;
        const hostsBefore = document.body.childElementCount;
        const svg = renderNativeScript(blocks, '<block id="hat"/>', 'hat', 'nl');
        expect(svg.getAttribute('viewBox')).toBe('-4 -20 208 108');
        expect(Number(svg.getAttribute('width'))).toBeCloseTo(166.4);
        expect(Number(svg.getAttribute('height'))).toBeCloseTo(86.4);
        expect(svg.querySelector('[data-id="hat"]').hasAttribute('transform')).toBe(false);
        expect(svg.querySelector('defs')).not.toBeNull();
        expect(workspace.dispose).toHaveBeenCalledTimes(1);
        expect(blocks.mainWorkspace).toBe(editor);
        expect(blocks.Msg).toBe(messages);
        expect(blocks.ScratchMsgs.currentLocale_).toBe('en');
        expect(blocks.Field.cacheReference_).toBe(1);
        expect(blocks.Events.disable).toHaveBeenCalledTimes(1);
        expect(blocks.Events.enable).toHaveBeenCalledTimes(1);
        expect(document.body.childElementCount).toBe(hostsBefore);
    });

    test('restores editor state even when loading a script fails', () => {
        const {blocks, editor, workspace} = createFixture();
        blocks.Xml.domToWorkspace.mockImplementation(() => {
            throw new Error('Unsupported block');
        });
        const messages = blocks.Msg;
        const hostsBefore = document.body.childElementCount;
        expect(() => renderNativeScript(blocks, '<block/>', 'hat', 'nl')).toThrow('Unsupported block');
        expect(workspace.dispose).toHaveBeenCalledTimes(1);
        expect(blocks.mainWorkspace).toBe(editor);
        expect(blocks.Msg).toBe(messages);
        expect(blocks.ScratchMsgs.currentLocale_).toBe('en');
        expect(blocks.Field.cacheReference_).toBe(1);
        expect(blocks.Events.enable).toHaveBeenCalledTimes(1);
        expect(document.body.childElementCount).toBe(hostsBefore);
    });

    test('renders with the selected theme and direction without changing editor colors', () => {
        const {blocks} = createFixture();
        blocks.Colours = {
            motion: {primary: '#old', secondary: '#other'},
            overrideColours: jest.fn(colours => Object.assign(blocks.Colours.motion, colours.motion))
        };
        const inject = blocks.inject;
        blocks.inject = jest.fn((host, options) => {
            blocks.Colours.overrideColours(options.colours);
            return inject(host, options);
        });
        renderNativeScript(blocks, '<block/>', 'hat', 'en', {
            colours: {motion: {primary: '#new'}},
            rtl: true
        });
        expect(blocks.inject.mock.calls[0][1].rtl).toBe(true);
        expect(blocks.Colours.motion).toEqual({primary: '#old', secondary: '#other'});
    });

    test('disposes a workspace left behind by a failed injection', () => {
        const {blocks, editor, workspace} = createFixture();
        blocks.inject = jest.fn(() => {
            blocks.mainWorkspace = workspace;
            blocks.Field.cacheReference_++;
            throw new Error('Injection failed');
        });
        expect(() => renderNativeScript(blocks, '<block/>', 'hat', 'en')).toThrow('Injection failed');
        expect(workspace.dispose).toHaveBeenCalledTimes(1);
        expect(blocks.mainWorkspace).toBe(editor);
        expect(blocks.Field.cacheReference_).toBe(1);
        expect(blocks.Events.enable).toHaveBeenCalledTimes(1);
    });

    [
        ['left arrow', '⬅'],
        ['a', 'A'],
        ['9', '9']
    ].forEach(([key, overlay]) => {
        test(`places a white keycap overlay for ${key} in the native key dropdown`, () => {
            const {blocks, workspace} = createFixture();
            const block = workspace.getBlockById();
            const root = block.getSvgRoot();
            const group = document.createElementNS(root.namespaceURI, 'g');
            const text = document.createElementNS(root.namespaceURI, 'text');
            text.setAttribute('x', '30');
            text.textContent = key;
            group.appendChild(text);
            root.appendChild(group);
            block.type = 'event_whenkeypressed';
            block.getField = () => ({getValue: () => key, getSvgRoot: () => group});
            workspace.getBlockById.mockReturnValue(block);
            const svg = renderNativeScript(blocks, '<block/>', 'hat', 'en');
            expect(svg.querySelector('text').textContent).toBe(overlay);
            expect(svg.querySelector('text').getAttribute('style')).toBe('fill: white');
            expect(svg.querySelector('image')).not.toBeNull();
        });
    });
});
