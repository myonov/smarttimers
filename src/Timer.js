import {EventEmitter} from "./EventEmitter";
import * as definitions from "./definitions"

const RUNNING_STATE = {
    INITIALIZED: 0,
    RUNNING: 1,
    PAUSED: 2,
    FINISHED: 3,
};

export class Timer extends EventEmitter {
    constructor(seconds, ticksPerSec = definitions.TICKS_PER_SEC) {
        super();
        this.seconds = seconds;
        this.ticksPerSec = ticksPerSec;
        this.ticks = 0;
        this.elapsedTicksSinceStart = 0;
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
        this.fire('stop', {
            runningTime: this._computeSeconds(this.ticks),
            pausedTime: this._computeSeconds(this._pauseTicks()),
        });
    }

    togglePause() {
        if (this.state === RUNNING_STATE.PAUSED) {
            this.state = RUNNING_STATE.RUNNING;
            this.fire('pauseOff')
        } else if (this.state === RUNNING_STATE.RUNNING) {
            this.state = RUNNING_STATE.PAUSED;
            this.fire('pauseOn');
        } else {
            throw new Error('Invalid running state');
        }
    }

    _pauseTicks() {
        return this.elapsedTicksSinceStart - this.ticks;
    }

    _computeSeconds(ticks) {
        return Math.floor(ticks / this.ticksPerSec);
    }

    _checkTickSecond() {
        return this.ticks % this.ticksPerSec === 0;
    }

    _checkPauseTickSecond() {
        return this._pauseTicks() % this.ticksPerSec === 0;
    }

    _checkFinished() {
        return this.seconds && this._computeSeconds(this.ticks) >= this.seconds;
    }

    tick() {
        this.elapsedTicksSinceStart++;
        if (this.state === RUNNING_STATE.RUNNING) {
            this.ticks++;
            this.fire('tick', this.ticks);
            if (this._checkTickSecond()) {
                this.fire('tickSecond', this._computeSeconds(this.ticks));
                if (this._checkFinished()) {
                    this.stop();
                }
            }
        } else {
            this.fire('pauseTick', this._pauseTicks());
            if (this._checkPauseTickSecond()) {
                this.fire('pauseTickSecond', this._computeSeconds(this._pauseTicks()));
            }
        }
    }
}

Timer.events = [
    'start', 'pauseOn', 'pauseOff', 'stop', 'tickSecond', 'pauseTick', 'pauseTickSecond'
];
