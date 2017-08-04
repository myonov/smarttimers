import {EventEmitter} from './EventEmitter';
import {ArrayIterator} from './ArrayIterator';
import {Timer} from './Timer';

import * as definitions from './definitions';

function getTimerFromTask(task) {
    if (task.type === definitions.TASK_CHOICES.STOPWATCH) {
        return new Timer();
    }
    return new Timer(task.timer);
}

export class TaskManager extends EventEmitter {
    constructor(timersData, timerCallbacks) {
        super();
        this.timersData = timersData;
        this.taskIterator = new ArrayIterator(timersData);
        this.currentTask = null;
        this.currentTaskTimer = null;
        this.nextTask = null;
        this.timerCallbacks = timerCallbacks || {};
        this.isFinished = false;
    }

    getTaskManagerCallback(event) {
        if (event === 'start') {
            return this.startTaskCallback.bind(this);
        }
        if (event === 'stop') {
            return this.stopTaskCallback.bind(this);
        }
        return function () {

        }
    }

    getCallback(event) {
        let taskManagerCallback = this.getTaskManagerCallback(event);
        let passedCallback = this.timerCallbacks[event] || (() => {
            });

        // return function instead of an arrow-function because of arguments
        return function () {
            let callbackArguments = Array.prototype.slice.call(arguments, 0);
            passedCallback.apply(this, callbackArguments);
            taskManagerCallback.apply(this, callbackArguments);
        };
    }

    attachCallbacks(timer) {
        for (let event of Timer.events) {
            timer.subscribe(event, this.getCallback(event));
        }
    }

    assignAndStartTimer() {
        this.currentTaskTimer = getTimerFromTask(this.currentTask);
        this.attachCallbacks(this.currentTaskTimer);
        this.currentTaskTimer.start();
    }

    startTaskCallback() {
        this.fire('taskManager:startTask',
            this.currentTask, this.nextTask, this.progressInfo);
    }

    stopTaskCallback(taskDuration) {
        this.fire('taskManager:stopTask', taskDuration);
        if (this.nextTask === null || this.isFinished) {
            this.fire('taskManager:stop');
            return;
        }

        this.currentTask = this.nextTask;
        this.progressInfo = this.taskIterator.getTasksProgress();
        this.nextTask = this.taskIterator.next();

        this.assignAndStartTimer();
    }

    start() {
        this.fire('taskManager:start');
        this.currentTask = this.taskIterator.next();
        this.progressInfo = this.taskIterator.getTasksProgress();
        if (this.currentTask === null) {
            this.fire('taskManager:stop');
        }
        this.nextTask = this.taskIterator.next();

        this.assignAndStartTimer();
    }

    stop() {
        // stops the current task
        this.currentTaskTimer.stop();
    }

    finish() {
        // finishes the TaskManager immediately
        this.isFinished = true;
        this.currentTaskTimer.stop();
    }

    togglePause() {
        this.fire('taskManager:togglePause');
        this.currentTaskTimer.togglePause();
    }
}
