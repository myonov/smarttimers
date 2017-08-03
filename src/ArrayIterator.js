import {TreeIterator} from './TreeIterator';
import * as definitions from './definitions';

class Node {
    constructor(node) {
        this.node = node;
        this.progress = {};
        this.taskIndex = null;
        this.remainingTime = null;
        this.isRemainingTimeKnown = null;
    }

    setProgressInfo(taskIndex, remainingTime, isRemainingTimeKnown) {
        this.taskIndex = taskIndex;
        this.remainingTime = remainingTime;
        this.isRemainingTimeKnown = isRemainingTimeKnown;
    }

    getProgressInfo() {
        if ([this.taskIndex, this.remainingTime, this.isRemainingTimeKnown].indexOf(null) !== -1) {
            throw new Error('Invalid node state');
        }
        return {
            taskIndex: this.taskIndex,
            remainingTime: this.remainingTime,
            isRemainingTimeKnown: this.isRemainingTimeKnown,
        }
    }
}

function getTimeStats(node) {
    if (node.type === definitions.TASK_CHOICES.TIMER) {
        return {
            remainingTime: node.timer,
            isRemainingTimeKnown: true,
        };
    }
    return {
        remainingTime: 0,
        isRemainingTimeKnown: false,
    }
}

export class ArrayIterator {
    _buildList() {
        while (true) {
            let next = this.treeIterator.next();
            if (next === null) {
                break;
            }
            this.nodes.push(new Node(next));
        }
    }

    _computeNode(currentIndex) {
        let nextNodeRemainingTime = null,
            nextNodeIsRemainingTimeKnown = null;

        if (currentIndex === this.nodes.length - 1) {
            nextNodeRemainingTime = 0;
            nextNodeIsRemainingTimeKnown = true;
        } else {
            let nextNodeProgressInfo = this.nodes[currentIndex + 1].getProgressInfo();
            nextNodeRemainingTime = nextNodeProgressInfo.remainingTime;
            nextNodeIsRemainingTimeKnown = nextNodeProgressInfo.isRemainingTimeKnown;
        }

        let {remainingTime, isRemainingTimeKnown} = getTimeStats(this.nodes[currentIndex].node);
        this.nodes[currentIndex].setProgressInfo(
            currentIndex,
            remainingTime + nextNodeRemainingTime,
            isRemainingTimeKnown && nextNodeIsRemainingTimeKnown);
    }

    _computeTimeStats() {
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
            return this.nodes[this.index].node;
        }
        return null;
    }

    getTasksProgress() {
        if (this.index === null || this.index >= this.nodes.length) {
            return null;
        }
        let progressInfo = this.nodes[this.index].getProgressInfo();
        let firstTaskInfo = this.nodes[0].getProgressInfo();
        if (firstTaskInfo.remainingTime === 0) {
            // there are no timer tasks in the task list
            return {
                percent: 100,
                currentTaskIndex: this.index,
                tasksCount: this.nodes.length,
                isRemainingTimeKnown: progressInfo.isRemainingTimeKnown,
            };
        } else {
            return {
                percent: parseInt((firstTaskInfo.remainingTime - progressInfo.remainingTime)
                    / firstTaskInfo.remainingTime * 100, 10),
                currentTaskIndex: this.index,
                tasksCount: this.nodes.length,
                isRemainingTimeKnown: progressInfo.isRemainingTimeKnown,
            };
        }
    }
}
