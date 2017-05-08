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

    renderTimerDisplay() {
        if (this.state.currentTask === null) {
            return null;
        }
        if (this.state.currentTask.type === 'timer') {
            let timeLeft = this.state.currentTask.timer - this.state.seconds;
            return <div>
                <span>Time left: {timeLeft}</span>
            </div>
        }
        return <div>
            <span>Passed: {this.state.seconds} seconds</span>
        </div>
    }

    renderNextTask() {
        if (this.state.nextTask === null) {
            return <div className="next-task">
                No next task
            </div>
        }
        return <div className="next-task">
            <h4>Next task: {this.state.nextTask.title}</h4>
            <div>
                <div>
                    Type: {this.state.nextTask.type}
                </div>
                <div>
                    Duration: {this.state.nextTask.timer ? this.state.nextTask.timer : '-'}
                </div>
            </div>
        </div>
    }

    renderTimeControls() {
        return null;
    }

    renderFinishedTasks() {
        return null;
    }

    render() {
        return <div>
            {this.renderTitle()}
            {this.renderTimerDisplay()}
            {this.renderNextTask()}
            {this.renderTimeControls()}
            {this.renderFinishedTasks()}
        </div>
    }
}
