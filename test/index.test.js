import chai from 'chai';
import { generateLines, createTestFile } from './setupTestEnv';
import getAsyncFileLinesIterator from '../src/index';

describe('getAsyncFileLinesIterator', function() {
    it('must be a function.', function() {
        chai.assert.isFunction(getAsyncFileLinesIterator);
    });

    it('must read all lines from file.', async function() {
        const lines = generateLines();
        const file = createTestFile({ lines });
        const readLines = [];

        const linesIterator = getAsyncFileLinesIterator(file);
        // let i = 0;
        for await (const line of linesIterator) {
            readLines.push(line);
            // console.log(`--> ${line}`);
            // chai.assert.equal(line, lines[i++]);
        }
        chai.assert.equal(readLines.length, lines.length);
    });

    // @TODO: https://mochajs.org/#dynamically-generating-tests
});
