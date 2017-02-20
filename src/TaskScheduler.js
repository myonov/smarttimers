import {EventEmitter} from "./EventEmitter";
import * as definitions from "./definitions"

export class TaskScheduler extends EventEmitter {
    constructor(timersData, ticksPerSec=definitions.TICKS_PER_SEC) {
        super();
        this.root = timersData;
        this.ticksPerSec = ticksPerSec;
        this.ticks = 0;
    }

    start() {
        let tickHandler = this.tick.bind(this);
        let milliseconds = 1000 / this.ticksPerSec;
        this.tickTimer = setInterval(tickHandler, milliseconds);
        this.fire('start');
    }

    stop() {
        clearInterval(this.tickTimer);
        this.fire('stop');
    }

    tick() {
        this.ticks++;
        if (this.ticks % this.ticksPerSec === 0) {
            this.fire('tickSecond', this.ticks / this.ticksPerSec)
        }
        this.fire('tick', this.ticks);
    }
}
