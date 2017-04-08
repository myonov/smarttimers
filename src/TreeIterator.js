export class TreeIterator {
    constructor(root) {
        this.root = root;
        this.parent = {};
        this.currentChildIndex = {};
        this.loopCounts = {};
        this.lastLeafNode = null;
        this.parent[root.id] = null;
        this.initStructure(this.root);
    }

    initStructure(v) {
        if (this.isLeafNode(v)) {
            return;
        }

        this.currentChildIndex[v.id] = 0;
        this.loopCounts[v.id] = 0;
        for (let childNode of v.taskList) {
            this.parent[childNode.id] = v;
            this.initStructure(childNode);
        }
    }

    hasNextChild(v) {
        return this.currentChildIndex[v.id] < v.taskList.length;
    }

    getNextChild(v) {
        let child = v.taskList[this.currentChildIndex[v.id]];
        this.currentChildIndex[v.id]++;
        return child;
    }

    isLeafNode(v) {
        return v.taskList === undefined;
    }

    hasNextIteration(v) {
        let repeat;
        if (this.root.id === v.id) {
            repeat = 1;
        } else {
            repeat = v.repeat;
        }
        return this.loopCounts[v.id] < repeat - 1;
    }

    nextIteration(v) {
        this.loopCounts[v.id]++;
        this.currentChildIndex[v.id] = 0;
        for (let childNode of v.taskList) {
            this.initStructure(childNode);
        }
    }

    descend(v) {
        if (this.hasNextChild(v)) {
            let nextChild = this.getNextChild(v);
            if (this.isLeafNode(nextChild)) {
                return nextChild;
            }
            return this.descend(nextChild);
        } else {
            if (this.hasNextIteration(v)) {
                this.nextIteration(v);
                return this.descend(v);
            }
        }
    }

    ascend(v) {
        if (v === null) {
            // root's parent; no more non-finished nodes
            return null;
        }
        if (this.isLeafNode(v)) {
            return this.ascend(this.parent[v.id]);
        }
        if (this.hasNextChild(v) || this.hasNextIteration(v)) {
            return v;
        }
        return this.ascend(this.parent[v.id]);
    }

    next() {
        if (this.lastLeafNode === null) {
            this.lastLeafNode = this.descend(this.root);
            if (this.lastLeafNode === null) {
                return null; // no more leaves
            }
            return this.lastLeafNode;
        } else {
            let firstNonFinishedNode = this.ascend(this.lastLeafNode);
            if (firstNonFinishedNode === null) {
                return null; // no more non-finished nodes
            }
            this.lastLeafNode = this.descend(firstNonFinishedNode);
            return this.lastLeafNode;
        }
    }
}
