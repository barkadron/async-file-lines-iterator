import { JSDOM } from 'jsdom';
import encoding from 'text-encoding';

// https://stackoverflow.com/questions/40662142/polyfill-for-textdecoder
global.TextDecoder = encoding.TextDecoder;

// https://github.com/airbnb/enzyme/blob/master/docs/guides/jsdom.md#using-enzyme-with-jsdom
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');

Object.defineProperties(global, {
    ...Object.getOwnPropertyDescriptors(jsdom.window),
    ...Object.getOwnPropertyDescriptors(global),
});

export function checkAsync(done, check) {
    let err = null;
    try {
        check();
    } catch (e) {
        err = e;
    } finally {
        done(err);
    }
}

export function generateLines({ lineText = 'x', lineLength = 100, linesCount = 10 } = {}) {
    const line = lineText.repeat(lineLength);
    return Array.from(Array(linesCount).fill(line), (elem, index) => {
        const lineNumber = (index + 1).toString().padStart(linesCount.toString().length, '0');
        const lineBreak = index !== linesCount - 1 ? '\n' : '';
        return `${lineNumber}__${elem}${lineBreak}`;
    });
}

export function createTestFile({ lines = [] }) {
    const fileName = 'test-file.txt';
    const fileType = 'text/plain';
    return new File(lines, fileName, { type: fileType });
}
