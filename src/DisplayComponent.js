import React from "react";
import FontAwesome from "react-fontawesome";

import {TaskScheduler} from "./TaskScheduler"
import {TreeIterator} from "./TreeIterator";

import "./DisplayComponent.css"

export default class DisplayComponent extends React.Component {
    constructor(props) {
        super(props);
        this.taskScheduler = new TaskScheduler(props.timersData);
        this.treeIterator = new TreeIterator(props.timersData);
        window.taskScheduler = this.taskScheduler;
        window.treeIterator = this.treeIterator;
        window.TreeIterator = TreeIterator;
    }

    render() {
        return <div>
            Running!
        </div>
    }
}
