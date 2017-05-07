import React from "react";
import FontAwesome from "react-fontawesome";

import {Timer} from "./Timer"
import {DisplayManager} from './DisplayManager';
import {TreeIterator} from "./TreeIterator";

import "./DisplayComponent.css"

export default class DisplayComponent extends React.Component {
    constructor(props) {
        super(props);
        this.displayManager = new DisplayManager(props.timersData);
        this.treeIterator = new TreeIterator(props.timersData);
        window.Timer = Timer;
    }

    render() {
        return <div>
            Running!
        </div>
    }
}
