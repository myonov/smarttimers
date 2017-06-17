import {TreeIterator} from './TreeIterator';

NodeHandler = {
    get: (target, name) => {
        if (name in target.task) {
            return target.task[name];
        }
        if (name in target.cache) {
            return target.cache[name];
        }
        return undefined;
    },

    set: (target, property, value, receiver) => {
        if (property in target.task) {
            target.task[property] = value;
        }
        target.cache[property] = value;
        return true;
    }
};

class _Node {
    constructor(task) {
        this.task = task;
        this.cache = {};
    }
}

const buildNode = (task) => {
    return new Proxy(new _Node(task), NodeHandler);
};

export class ArrayIterator {
    _initIterator() {
        while (true) {
            let next = this.treeIterator.next();
            if (next === null) {
                break;
            }
            this.nodes.push(buildNode(next));
        }
    }

    constructor(root) {
        this.root = root;
        this.treeIterator = TreeIterator(root);
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
