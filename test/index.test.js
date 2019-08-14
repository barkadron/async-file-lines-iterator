import chai from 'chai';
import { generateLines, createTestFile } from './setupTestEnv';

import getAsyncFileLinesIterator from '../src/index';

describe('getAsyncFileLinesIterator:', function() {
    it('must be a function.', function() {
        chai.assert.isFunction(getAsyncFileLinesIterator);
    });

    it('must return async-iterable object.', function() {
        const file = createTestFile();
        const linesIterator = getAsyncFileLinesIterator(file);
        chai.assert.equal(typeof linesIterator[Symbol.asyncIterator], 'function');
    });

    describe('asyncFileLinesIterator:', function() {
        const lines = generateLines({ linesCount: 500 });
        const file = createTestFile({ lines });

        describe(`for test-file with ${lines.length} lines and size = ${file.size} bytes:`, function() {
            const linesLimits = [
                0,
                1,
                Math.floor(lines.length / 2),
                lines.length - 1,
                lines.length,
                lines.length + 1,
                undefined,
            ];

            const chunkSizes = [
                0,
                50,
                Math.floor(file.size / 2),
                file.size - 1,
                file.size,
                file.size + 1,
                undefined,
            ];

            const tests = [];
            chunkSizes.forEach(chunkSize => {
                linesLimits.forEach(linesLimit => {
                    tests.push({
                        args: { chunkSize, linesLimit },
                        expected:
                            linesLimit === undefined || linesLimit >= lines.length
                                ? lines.length
                                : linesLimit,
                    });
                });
            });

            for (let i = 0; i < tests.length; i++) {
                const test = tests[i];
                const readLines = [];
                const linesIterator = getAsyncFileLinesIterator(file, {
                    linesLimit: test.args.linesLimit,
                    chunkSize: test.args.chunkSize,
                });

                const message = `must read ${
                    test.args.linesLimit === test.expected ? test.expected : 'all'
                } lines if 'linesLimit' = ${
                    test.args.linesLimit === undefined || test.args.linesLimit <= test.expected
                        ? test.args.linesLimit
                        : '<more than exists>'
                } and 'chunkSize' = ${
                    test.args.chunkSize === undefined || test.args.chunkSize <= file.size
                        ? test.args.chunkSize
                        : '<more than file.size>'
                }`;

                // https://mochajs.org/#dynamically-generating-tests
                it(message, async function() {
                    let lineNum = 0;
                    for await (const line of linesIterator) {
                        readLines.push(`${line}${lineNum + 1 !== lines.length ? '\n' : ''}`);
                        chai.assert.equal(lines[lineNum], readLines[lineNum]);
                        lineNum++;
                    }
                    chai.assert.equal(readLines.length, test.expected);
                });
            }
        });
    });
});
