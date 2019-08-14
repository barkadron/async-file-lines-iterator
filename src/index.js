import LazyFileReader from './LazyFileReader';

export default async function* getAsyncFileLinesIterator(...args) {
    const reader = new LazyFileReader(...args);
    let lines = null;

    do {
        lines = await reader.fetchLines(); // read arrays of lines over chunk
        for (let i = 0; lines && lines.length > i; i++) {
            yield lines[i];
        }
    } while (lines);

    return null;
}
