import React from "react";
import FontAwesome from "react-fontawesome";

import {TaskManager} from './TaskManager';

import "./DisplayComponent.css"

export default class DisplayComponent extends React.Component {
    constructor(props) {
        super(props);

        this.bindHandlers();

        let timerCallbacks = {
            tickSecond: this.tickSecondHandler,
            pauseTickSeconds: this.pauseTickSecondHandler,
        };

        this.taskManager = new TaskManager(props.timersData, timerCallbacks);
        window.taskManager = this.taskManager;

        this.state = {
            currentTask: null,
            nextTask: null,
            seconds: 0,
            pauseSeconds: 0,
        };
    }

    bindHandlers() {
        this.tickSecondHandler = this.tickSecondHandler.bind(this);
        this.pauseTickSecondHandler = this.pauseTickSecondHandler.bind(this);
        this.startTaskHandler = this.startTaskHandler.bind(this);
    }

    startTaskHandler(currentTask, nextTask) {
        this.setState({
            seconds: 0,
            pauseSeconds: 0,
            currentTask: currentTask,
            nextTask: nextTask,
        });
    }

    tickSecondHandler(seconds) {
        this.setState({
            seconds: seconds,
        })
    }

    pauseTickSecondHandler(seconds) {
        this.setState({
            seconds: seconds,
        })
    }

    componentDidMount() {
        this.taskManager.subscribe('taskManager:startTask', this.startTaskHandler);
        this.taskManager.start();
    }

    componentWillUnmount() {
        this.taskManager.unsubscribe('taskManager:startTask', this.startTaskHandler);
    }

    renderTitle() {
        let title;
        if (!this.state.currentTask) {
            title = 'No task started';
        } else {
            title = this.state.currentTask.title;
        }

        return <h3 className="task-title">
            {title}
        </h3>
    }

    render() {
        return <div>
            {this.renderTitle()}

            <div>
                <span>Passed: {this.state.seconds} seconds</span>
            </div>
        </div>
    }
}
