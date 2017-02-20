import React from "react";
import FontAwesome from "react-fontawesome";

import {TaskScheduler} from "./TaskScheduler"

import "./DisplayComponent.css"

export default class DisplayComponent extends React.Component {
    constructor(props) {
        super(props);
        this.taskScheduler = new TaskScheduler(props.timersData);
        window.taskScheduler = this.taskScheduler;
    }

    render() {
        return <div>
            Running!
        </div>
    }
}
