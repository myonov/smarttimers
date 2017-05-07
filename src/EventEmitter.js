export class EventEmitter {
    constructor() {
        this.eventMap = {};
    }

    subscribe(event, fn) {
        this.eventMap[event] = this.eventMap[event] || [];
        this.eventMap[event].push(fn);
    }

    unsubscribe(event, fn) {
        if (!this.eventMap[event]) {
            return;
        }
        let index = this.eventMap[event].indexOf(fn);
        if (index !== -1) {
            this.eventMap[event].splice(index, 1);
        }
    }

    fire(event) {
        console.log(event, arguments);
        if (!this.eventMap[event]) {
            return;
        }
        let callbackArguments = Array.prototype.slice.call(arguments, 1);
        for (let cb of this.eventMap[event]) {
            cb.apply(this, callbackArguments)
        }
    }
}
