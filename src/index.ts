import fetch from 'node-fetch';
import { isMainThread, workerData, Worker } from 'worker_threads';
import { writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { exit } from 'process';
import 'colors';

const MAX_BUFFER_COUNT = Math.floor((a => isNaN(a) ? 0 : a)(Number(process.env.MAX_BUFFER_COUNT))) || 10;
const MAX_BUFFER_SIZE = Math.floor((a => isNaN(a) ? 0 : a)(Number(process.env.MAX_BUFFER_COUNT))) || 500;

if (MAX_BUFFER_COUNT < 1 || !isFinite(MAX_BUFFER_COUNT)) {
    console.log(`[WARN] Max buffer limit is set to NONE, this will cause app to use way more system resources than it should be using`.yellow);
}

if (MAX_BUFFER_SIZE < 1 || !isFinite(MAX_BUFFER_SIZE)) {
    console.log(
        `[WARN] Max buffer size is set to NONE, this will cause this app to slow down and use way more system resources that it should be using`.yellow
    );
}

async function childMain() {
    const id = new Array(16).fill(0).map(() => `${Math.floor(Math.random() * 10)}`).join('');
    console.log(`[THREAD/${id}] Starting up...`);
    try {
        await Promise.all(workerData.map((a : string) => Promise.race([fetch(a, {
            method: 'GET',
        }), new Promise<string>(res => setTimeout(() => res(a), 5000))]).then(async resp => {
            const filename = (typeof resp == 'string' ? resp : resp.url)
                .replace(/[\/\\:]/g, "_");
            if (process.env.NOMETA != 'true') await writeFile(
                `${__dirname}/../output/${filename}.meta.json`,
                typeof resp == 'string' ? JSON.stringify({
                    status: 'timed out',
                }, null, 4) : JSON.stringify({
                    status: resp.status,
                }, null, 4),
            );
            if (typeof resp == 'string') return console.log(`[THREAD/${id}] ${resp} timed out`.red);
            console.log(`[THREAD/${id}] Got responce from ${resp.url}`.green);
            await writeFile(`${__dirname}/../output/${filename}.html`, await resp.text(), {
                encoding: 'utf8',
            });
        }, () => {})));
    } catch (err) {}
    console.log(`[THREAD/${id}] Gracefully exiting....`);
    exit(0);
}

async function main() {
    console.log(`Starting up...`);
    if (!existsSync(`${__dirname}/../output/`)) mkdirSync(`${__dirname}/../output`);

    let threads : Worker[] = [];
    let buf : string[] = [];

    for (let p1 = 1; p1 < 255; p1++) {
        for (let p2 = 1; p2 < 255; p2++) {
            for (let p3 = 1; p3 < 255; p3++) {
                for (let p4 = 1; p4 < 255; p4++) {
                    if (p4 >= 127 && p4 <= 192) continue;
                    for (const port of [80]) {
                        buf.push(`http://${p4}.${p3}.${p2}.${p1}:${port}`);
                        if ((isFinite(MAX_BUFFER_SIZE) && MAX_BUFFER_SIZE > 0) && buf.length >= MAX_BUFFER_SIZE) {
                            if (isFinite(MAX_BUFFER_COUNT) && MAX_BUFFER_COUNT > 0) if (threads.length >= MAX_BUFFER_COUNT) {
                                await new Promise<undefined>(res => {
                                    console.log(`Awaiting for empty thread...`);
                                    const i = setInterval(() => {
                                        if (threads.length < 10) {
                                            clearInterval(i);
                                            res(undefined);
                                        }
                                    });
                                });
                            }
                            const worker = new Worker(__filename, {
                                workerData: buf,
                            });
                            threads.push(worker);
                            worker.on('exit', () => {
                                threads.splice(threads.indexOf(worker), 1);
                            });
                            worker.on('message', m => {
                                process.stdout.write(m);
                            });
                            buf = [];
                        }
                    }
                }
            }
        }
    }

    if (isFinite(MAX_BUFFER_COUNT) && MAX_BUFFER_COUNT > 0) if (threads.length >= MAX_BUFFER_COUNT) {
        await new Promise<undefined>(res => {
            const i = setInterval(() => {
                if (threads.length < 10) {
                    clearInterval(i);
                    res(undefined);
                }
            });
        });
    }
    
    const worker = new Worker(__filename, {
        workerData: buf,
    });
    threads.push(worker);
    worker.on('exit', () => {
        threads.splice(threads.indexOf(worker), 1);
    });
    worker.on('message', m => {
        process.stdout.write(m);
    });
}
if (require.main == module) isMainThread ? main() : childMain();
