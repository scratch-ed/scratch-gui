import log from '../../lib/log';
import keycapIcon from '../timeline/keycap.png';
import {getKeyOnIcon} from './helpers.ts';

const SCRIPT_SCALE = 0.75;

/**
 * Replace a key hat's displayed dropdown text with the timeline's keycap.
 * @param {object} block The rendered top block in the temporary workspace.
 * @returns {void}
 */
const useKeycapIcon = block => {
    if (block.type !== 'event_whenkeypressed') return;
    const field = block.getField('KEY_OPTION');
    const key = field && field.getValue();
    if (typeof key !== 'string' || !/^(space|any|(left|right|up|down) arrow|[a-z0-9])$/i.test(key)) return;
    const group = field.getSvgRoot();
    const originalText = group && group.querySelector('text');
    if (!originalText) return;
    const x = Number(originalText.getAttribute('x'));
    if (!Number.isFinite(x)) return;
    const namespace = 'http://www.w3.org/2000/svg';
    const image = document.createElementNS(namespace, 'image');
    image.setAttribute('x', x - 12.5);
    image.setAttribute('y', '3.5');
    image.setAttribute('width', '25');
    image.setAttribute('height', '25');
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', keycapIcon);
    const text = document.createElementNS(namespace, 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', '16');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('style', 'fill: white');
    text.setAttribute('font-size', '12');
    text.textContent = getKeyOnIcon(key);
    group.replaceChild(image, originalText);
    group.insertBefore(text, image.nextSibling);
};

/**
 * Render a serialized script with Scratch Blocks without retaining another workspace.
 * @param {object} blocks Scratch Blocks used by the editor.
 * @param {string} xml The selected script in VM workspace XML format.
 * @param {string} scriptId The script's top block ID.
 * @param {string} locale The selected editor language.
 * @param {object} options The editor's theme colors and text direction.
 * @returns {SVGElement} A read-only SVG containing the rendered script.
 */
export const renderNativeScript = (blocks, xml, scriptId, locale, options = {}) => {
    const mainWorkspace = blocks.mainWorkspace;
    if (!mainWorkspace) throw new Error('The Scratch editor workspace is unavailable');

    const host = document.createElement('div');
    Object.assign(host.style, {
        position: 'fixed', left: '-10000px', top: '0', width: '1200px', height: '1000px', visibility: 'hidden'
    });
    document.body.appendChild(host);
    const previousMessages = blocks.Msg;
    const previousLocale = blocks.ScratchMsgs.currentLocale_;
    const previousCacheReferences = blocks.Field.cacheReference_;
    const previousColours = {};
    if (options.colours) {
        Object.keys(options.colours).forEach(key => {
            const value = blocks.Colours[key];
            if (Object.prototype.hasOwnProperty.call(blocks.Colours, key)) {
                previousColours[key] = value && typeof value === 'object' ? {...value} : value;
            }
        });
    }
    let workspace;
    blocks.Events.disable();
    try {
        if (!blocks.ScratchMsgs.locales[locale]) {
            log.warn(`Scratch block labels are unavailable for locale ${locale}; using English`);
        }
        blocks.ScratchMsgs.setLocale(blocks.ScratchMsgs.locales[locale] ? locale : 'en');
        workspace = blocks.inject(host, {
            readOnly: true,
            sounds: false,
            scrollbars: false,
            media: mainWorkspace.options.pathToMedia,
            rtl: typeof options.rtl === 'boolean' ? options.rtl : mainWorkspace.options.RTL,
            colours: options.colours
        });
        blocks.Xml.domToWorkspace(blocks.Xml.textToDom(`<xml>${xml}</xml>`), workspace);
        const block = workspace.getBlockById(scriptId);
        if (!block) throw new Error(`Scratch Blocks did not render script ${scriptId}`);
        useKeycapIcon(block);
        const root = block.getSvgRoot();
        const bounds = root.getBBox();
        if (!bounds.width || !bounds.height) throw new Error(`Scratch Blocks rendered empty script ${scriptId}`);
        const padding = 4;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `${bounds.x - padding} ${bounds.y - padding} ${
            bounds.width + (padding * 2)} ${bounds.height + (padding * 2)}`);
        svg.setAttribute('width', (bounds.width + (padding * 2)) * SCRIPT_SCALE);
        svg.setAttribute('height', (bounds.height + (padding * 2)) * SCRIPT_SCALE);
        svg.setAttribute('aria-hidden', 'true');
        const defs = workspace.getParentSvg().querySelector('defs');
        if (defs) svg.appendChild(defs.cloneNode(true));
        const script = root.cloneNode(true);
        script.removeAttribute('transform');
        svg.appendChild(script);
        return svg;
    } finally {
        try {
            const temporaryWorkspace = workspace || (blocks.mainWorkspace !== mainWorkspace && blocks.mainWorkspace);
            if (temporaryWorkspace) temporaryWorkspace.dispose();
        } finally {
            try {
                while (blocks.Field.cacheReference_ > previousCacheReferences) blocks.Field.stopCache();
                blocks.mainWorkspace = mainWorkspace;
                blocks.Msg = previousMessages;
                blocks.ScratchMsgs.currentLocale_ = previousLocale;
                if (options.colours) blocks.Colours.overrideColours(previousColours);
            } finally {
                blocks.Events.enable();
                host.remove();
            }
        }
    }
};
