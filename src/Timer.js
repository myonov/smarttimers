import {EventEmitter} from "./EventEmitter";
import * as definitions from "./definitions"

const RUNNING_STATE = {
    INITIALIZED: 0,
    RUNNING: 1,
    PAUSED: 2,
    FINISHED: 3,
};

export class Timer extends EventEmitter {
    constructor(seconds, ticksPerSec=definitions.TICKS_PER_SEC) {
        super();
        this.seconds = seconds;
        this.ticksPerSec = ticksPerSec;
        this.ticks = 0;
        this.elapsedTickSinceStart = 0;
        this.state = RUNNING_STATE.INITIALIZED;
    }

    start() {
        let tickHandler = this.tick.bind(this);
        let milliseconds = 1000 / this.ticksPerSec;
        this.tickTimer = setInterval(tickHandler, milliseconds);
        this.state = RUNNING_STATE.RUNNING;
        this.fire('start');
    }

    stop() {
        clearInterval(this.tickTimer);
        this.state = RUNNING_STATE.FINISHED;
        this.fire('stop');
    }

    togglePause() {
        if (this.state === RUNNING_STATE.PAUSED) {
            this.state = RUNNING_STATE.RUNNING;
        } else if (this.state === RUNNING_STATE.RUNNING) {
            this.state = RUNNING_STATE.PAUSED;
        } else {
            throw 'Invalid running state';
        }
    }

    _computeSeconds() {
        return this.ticks / this.ticksPerSec;
    }

    _checkTickSecond() {
        return this.ticks % this.ticksPerSec === 0;
    }

    _checkFinished() {
        return this.seconds && this._computeSeconds() >= this.seconds;
    }

    tick() {
        this.elapsedTickSinceStart++;
        if (this.state === RUNNING_STATE.RUNNING) {
            this.ticks++;
            this.fire('tick', this.ticks);
            if (this._checkTickSecond()) {
                this.fire('tickSecond', this.ticks / this.ticksPerSec);
                if(this._checkFinished()) {
                    this.stop();
                    return;
                }
            }
        }
    }
}
