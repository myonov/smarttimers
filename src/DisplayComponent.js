import React from "react";
import FontAwesome from "react-fontawesome";

import {Timer} from "./Timer"
import {TaskManager} from './TaskManager';
import {TreeIterator} from "./TreeIterator";

import "./DisplayComponent.css"

export default class DisplayComponent extends React.Component {
    constructor(props) {
        super(props);
        this.taskManager = new TaskManager(props.timersData);
        this.treeIterator = new TreeIterator(props.timersData);
        window.Timer = Timer;
        window.treeIterator = this.treeIterator;
        window.taskManager = this.taskManager;
    }

    render() {
        return <div>
            Running!
        </div>
    }
}
