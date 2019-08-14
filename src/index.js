const defaultLinesLimit = Number.POSITIVE_INFINITY; // unlimited
const defaultEndLinePattern = /\n/;
const defaultChunkSize = 10 * 1024 * 1024; // 10MB

class AsyncFileLinesIterator {
    constructor(
        file,
        {
            chunkSize = defaultChunkSize, // for balance between speed and RAM usage (more chunkSize => more speed => more memory)
            linesLimit = defaultLinesLimit,
            endLinePatter = defaultEndLinePattern,
        } = {}
    ) {
        if (!(file && file.toString() === '[object File]')) {
            throw new Error(`Error! Invalid argument 'file'.`);
        }

        this.file = file;
        this.chunkSize = chunkSize <= 0 ? defaultChunkSize : chunkSize;
        this.linesLimit = linesLimit;
        this.endLinePatter = endLinePatter;

        this.reader = new FileReader();
        this.decoder = new TextDecoder();

        this.offset = 0;
        this.lineCount = 0;
        this.buffer = '';
        this.needStop = false;

        this.reader.onload = () => this.parseLines();
        this.reader.onerror = err => this.reject(err);
    }

    async *[Symbol.asyncIterator]() {
        while (true) {
            const lines = await this.fetchLines(); // read lines over chunk
            for (let i = 0; lines.length > i; i++) {
                yield lines[i];
            }

            if (this.needStop) {
                return null;
            }
        }
    }

    async fetchLines() {
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            try {
                if (this.lineCount === this.linesLimit) {
                    // lines limit reached
                    this.needStop = true;
                    this.resolve([]);
                } else if (this.offset > 0 && this.offset >= this.file.size) {
                    // no more lines in file
                    this.needStop = true;
                    this.resolve([this.buffer]);
                } else {
                    const chunk = this.file.slice(this.offset, this.offset + this.chunkSize);
                    this.reader.readAsArrayBuffer(chunk);
                    this.offset += this.chunkSize;
                }
            } catch (e) {
                this.reject(e);
            }
        });
    }

    parseLines() {
        try {
            this.buffer += this.decoder.decode(this.reader.result, { stream: true }); // line can be cut in the middle of a multi-byte character
            const lines = this.buffer.split(this.endLinePatter); // @FIXME: loosing end-line character

            // don't process last line (for case if the line did cut)
            this.buffer = lines.pop();
            this.lineCount += lines.length;

            // truncate lines if read too many
            if (this.lineCount > this.linesLimit) {
                lines.length -= this.lineCount - this.linesLimit;
                this.lineCount = this.linesLimit;
            }

            this.resolve(lines);
        } catch (e) {
            this.reject(e);
        }
    }
}

const getAsyncFileLinesIterator = (...args) => new AsyncFileLinesIterator(...args);

export default getAsyncFileLinesIterator;
