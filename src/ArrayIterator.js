import {TreeIterator} from './TreeIterator';
import * as definitions from './definitions';

const NodeHandler = {
    get: (target, name) => {
        if (name in target.task) {
            return target.task[name];
        }
        if (name in target.cache) {
            return target.cache[name];
        }
        if (name in target) {
            return target[name];
        }
        return undefined;
    },

    set: (target, property, value, receiver) => {
        target.cache[property] = value;
        return true;
    }
};

class _Node {
    constructor(task) {
        this.task = task;
        this.cache = {};
    }

    getTimeStats() {
        // access these properties from a proxy object
        if (this.type === definitions.TASK_CHOICES.TIMER) {
            return {
                remainingTime: this.timer,
                isRemainingTimeKnown: true,
            };
        }
        return {
            remainingTime: 0,
            isRemainingTimeKnown: false,
        }
    }
}

const buildNode = (task) => {
    return new Proxy(new _Node(task), NodeHandler);
};

export class ArrayIterator {
    _buildList() {
        while (true) {
            let next = this.treeIterator.next();
            if (next === null) {
                break;
            }
            this.nodes.push(buildNode(next));
        }
    }

    _computeNode(currentIndex) {
        let prevRemainingTime = null,
            prevIsRemainingTimeKnown = null;

        if (currentIndex === this.nodes.length - 1) {
            prevRemainingTime = 0;
            prevIsRemainingTimeKnown = true;
        } else {
            prevRemainingTime = this.nodes[currentIndex + 1].remainingTime;
            prevIsRemainingTimeKnown = this.nodes[currentIndex + 1].isRemainingTimeKnown;
        }

        let {remainingTime, isRemainingTimeKnown} = this.nodes[currentIndex].getTimeStats();
        this.nodes[currentIndex].remainingTime = remainingTime + prevRemainingTime;
        this.nodes[currentIndex].isRemainingTimeKnown = isRemainingTimeKnown &&
            prevIsRemainingTimeKnown;
    }

    _computeTimeStats() {
        if (this.nodes.length === 0) {
            return;
        }
        this._computeNode(this.nodes.length - 1);
        for (let i = this.nodes.length - 2; i >= 0; --i) {
            this._computeNode(i);
        }
    }

    _initIterator() {
        this._buildList();
        this._computeTimeStats();
    }

    constructor(root) {
        this.root = root;
        this.treeIterator = new TreeIterator(root);
        this.nodes = [];
        this.index = null;
        this._initIterator();
    }

    next() {
        if (this.index === null) {
            this.index = 0;
        } else {
            this.index++;
        }
        if (this.index < this.nodes.length) {
            return this.nodes[this.index];
        }
        return null;
    }
}
