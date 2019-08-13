import chai from 'chai';
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

const { assert } = chai;

function checkAsync(done, check) {
    let err = null;
    try {
        check();
    } catch (e) {
        err = e;
    } finally {
        done(err);
    }
}

export { assert };
export { checkAsync };
