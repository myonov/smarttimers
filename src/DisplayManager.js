import {EventEmitter} from "./EventEmitter";
import {TreeIterator} from "./TreeIterator";

export class DisplayManager extends EventEmitter {
    constructor(timersData) {
        super();
        this.timersData = timersData;
        this.treeIterator = new TreeIterator(timersData);
    }
}
