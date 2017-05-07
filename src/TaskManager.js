import {EventEmitter} from "./EventEmitter";
import {TreeIterator} from "./TreeIterator";
import {Timer} from "./Timer";

function getTimerFromTask(task) {
    if (task.type === 'stopwatch') {
        return new Timer();
    }
    return new Timer(task.timer);
}

export class TaskManager extends EventEmitter {
    constructor(timersData, callbacks) {
        super();
        this.timersData = timersData;
        this.treeIterator = new TreeIterator(timersData);
        this.currentTask = null;
        this.currentTaskTimer = null;
        this.nextTask = null;
        this.callbacks = callbacks || {};
    }

    getTaskManagerCallback(event) {
        if (event === 'start') {
            return this.startTaskCallback.bind(this);
        }
        if (event === 'stop') {
            return this.stopTaskCallback.bind(this);
        }
        return () => {
        };
    }

    getCallback(event) {
        let taskManagerCallback = this.getTaskManagerCallback(event);
        let passedCallback = this.callbacks[event] || (() => {
            });

        // return function instead of an arrow-function because of arguments
        return function () {
            passedCallback(arguments);
            taskManagerCallback(arguments);
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
        this.fire('taskManager:startTask', this.currentTask, this.nextTask);
    }

    stopTaskCallback(taskDuration) {
        this.fire('taskManager:stopTask', taskDuration);
        if (this.nextTask === null) {
            this.fire('taskManager:stop');
            return;
        }

        this.currentTask = this.nextTask;
        this.nextTask = this.treeIterator.next();

        this.assignAndStartTimer();
    }

    start() {
        this.fire('taskManager:start');
        this.currentTask = this.treeIterator.next();
        if (this.currentTask === null) {
            this.fire('taskManager:stop');
        }
        this.nextTask = this.treeIterator.next();

        this.assignAndStartTimer();
    }

    stop() {
        this.currentTaskTimer.stop();
    }

    togglePause() {
        this.currentTaskTimer.togglePause();
    }
}
