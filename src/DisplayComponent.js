import React from 'react';
import FontAwesome from 'react-fontawesome';

import {TaskManager} from './TaskManager';
import {deepCopy} from './utils';

import * as definitions from './definitions';

import './DisplayComponent.css';

import stop from '../resources/stop.wav';
import tick from '../resources/tick.wav';


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
            finishedTasks: [],
        };
    }

    bindHandlers() {
        this.tickSecondHandler = this.tickSecondHandler.bind(this);
        this.pauseTickSecondHandler = this.pauseTickSecondHandler.bind(this);
        this.startTaskHandler = this.startTaskHandler.bind(this);
        this.stopTaskHandler = this.stopTaskHandler.bind(this);
    }

    startTaskHandler(currentTask, nextTask) {
        this.setState({
            seconds: 0,
            pauseSeconds: 0,
            currentTask: currentTask,
            nextTask: nextTask,
        }, () => {
            if (this.checkLimitThreshold()) {
                this.audioCallback('tick');
            }
        });
    }

    checkLimitThreshold() {
        let currentTask = this.state.currentTask;
        return currentTask !== null &&
            currentTask.type === definitions.TASK_CHOICES.TIMER &&
            currentTask.timer - this.state.seconds <= definitions.LIMIT_SECONDS_THRESHOLD;
    }

    audioCallback(event) {
        const resources = {
            'tick': tick,
            'stop': stop,
        };
        if (definitions.PLAY_AUDIO) {
            let audio = new Audio(resources[event]);
            audio.play()
        }
    }

    stopTaskHandler(timeStats) {
        let finishedTasksCopy = deepCopy(this.state.finishedTasks);
        this.audioCallback('stop');
        finishedTasksCopy.push({
            task: this.state.currentTask,
            timeStats: timeStats,
        });
        this.setState({
            finishedTasks: finishedTasksCopy,
        })
    }

    tickSecondHandler(seconds) {
        this.setState({
            seconds: seconds,
        }, () => {
            if (this.checkLimitThreshold()) {
                this.audioCallback('tick');
            }
        });
    }

    pauseTickSecondHandler(seconds) {
        this.setState({
            seconds: seconds,
        })
    }

    componentDidMount() {
        this.taskManager.subscribe('taskManager:startTask', this.startTaskHandler);
        this.taskManager.subscribe('taskManager:stopTask', this.stopTaskHandler);
        this.taskManager.start();
    }

    componentWillUnmount() {
        this.taskManager.unsubscribe('taskManager:startTask', this.startTaskHandler);
        this.taskManager.unsubscribe('taskManager:stopTask', this.stopTaskHandler);
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
        if (this.state.currentTask.type === definitions.TASK_CHOICES.TIMER) {
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

    renderTimerControls() {
        return <div className="timer-controls">
            <a onClick={() => this.taskManager.togglePause()}>
                Toggle Pause
            </a>
            <a onClick={() => this.taskManager.stop()}>
                Stop
            </a>
            <a onClick={() => this.taskManager.finish()}>
                Finish
            </a>
        </div>
    }

    renderFinishedTasks() {
        return <div className="finished-tasks">
            <ol>
                {this.state.finishedTasks.map((item) => {
                    return <li>
                        Task name: {item.task.title}<br />
                        Type: {item.task.type}<br />
                        Running time: {item.timeStats.runningTime};
                        Paused time: {item.timeStats.pausedTime}
                    </li>
                })}
            </ol>
        </div>
    }

    render() {
        return <div>
            {this.renderTitle()}
            {this.renderTimerDisplay()}
            {this.renderTimerControls()}
            {this.renderNextTask()}
            {this.renderFinishedTasks()}
        </div>
    }
}
