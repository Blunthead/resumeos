// Runs at most `max` async jobs at once and queues the rest. Used to keep
// Chromium from rendering many PDFs in parallel, which is what runs a small
// instance out of memory.
export function createLimiter(max: number) {
    let active = 0;
    const waiting: Array<() => void> = [];

    return {
        get queued() {
            return waiting.length;
        },
        async run<T>(job: () => Promise<T>): Promise<T> {
            // A finishing job hands its slot straight to the next waiter, so
            // `active` never dips below the real count between the two.
            if (active >= max) await new Promise<void>((resolve) => waiting.push(resolve));
            else active += 1;
            try {
                return await job();
            } finally {
                const next = waiting.shift();
                if (next) next();
                else active -= 1;
            }
        },
    };
}
