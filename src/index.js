const defaultLinesLimit = Number.POSITIVE_INFINITY; // unlimited
const defaultEndLinePattern = /\n/;
const defaultChunkSize = 10 * 1024; // bytes

class AsyncFileLinesIterator {
    constructor(
        file,
        {
            linesLimit = defaultLinesLimit,
            endLinePatter = defaultEndLinePattern,
            chunkSize = defaultChunkSize,
        } = {}
    ) {
        if (!(file && file.toString() === '[object File]')) {
            throw new Error(`Error! Invalid argument 'file'.`);
        }

        this.file = file;
        this.endLinePatter = endLinePatter;
        this.chunkSize = chunkSize;
        this.linesLimit = linesLimit;

        this.reader = new FileReader();
        this.decoder = new TextDecoder();

        this.offset = 0;
        this.lineCount = 0;
        this.buffer = '';
        this.needStop = false;

        this.fetchLines = () => {
            try {
                if (this.lineCount === this.linesLimit) {
                    // lines limit reached
                    this.needStop = true;
                    this.resolve(null);
                } else if (this.offset > 0 && this.offset >= this.file.size) {
                    // no more lines in file
                    this.needStop = true;
                    this.resolve([this.buffer]);
                } else {
                    const chunk = this.file.slice(this.offset, this.offset + this.chunkSize);
                    this.reader.readAsArrayBuffer(chunk);
                }
            } catch (e) {
                this.reject(e);
            }
        };

        this.parseLines = () => {
            let lines = null;
            try {
                this.offset += this.chunkSize;
                this.buffer += this.decoder.decode(this.reader.result, { stream: true }); // line can be cut in the middle of a multi-byte character

                lines = this.buffer.split(this.endLinePatter); // @FIXME: loosing end-line character
                this.buffer = lines.pop(); // don't process last line (for case if the line did cut)
                this.lineCount += lines.length;

                if (this.lineCount > this.linesLimit) {
                    // truncate lines if read too many
                    lines.length -= this.lineCount - this.linesLimit;
                    this.lineCount = this.linesLimit;
                }
            } catch (e) {
                this.reject(e);
            }

            return lines;
        };

        this.reader.onerror = e => {
            this.reject(e);
        };

        this.reader.onload = () => {
            const lines = this.parseLines();
            this.resolve(lines);
        };
    }

    async *[Symbol.asyncIterator]() {
        while (true) {
            const resultLines = await new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
                this.fetchLines(); // read lines in chunk
            });

            if (resultLines) {
                for (let i = 0; resultLines.length > i; i++) {
                    yield Promise.resolve(resultLines[i]);
                }
            }

            if (this.needStop) {
                return null;
            }
        }
    }
}

const getAsyncFileLinesIterator = (...args) => new AsyncFileLinesIterator(...args);

export default getAsyncFileLinesIterator;
