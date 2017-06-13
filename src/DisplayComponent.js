import React from 'react';
import FontAwesome from 'react-fontawesome';

import {TaskManager} from './TaskManager';
import {deepCopy, formatZeroPadSeconds} from './utils';

import * as definitions from './definitions';

import './DisplayComponent.css';

export default class DisplayComponent extends React.Component {
    constructor(props) {
        super(props);

        this.bindHandlers();

        let timerCallbacks = {
            tickSecond: this.tickSecondHandler,
            pauseTickSecond: this.pauseTickSecondHandler,
            togglePause: this.togglePauseHandler,
        };

        this.taskManager = new TaskManager(props.timersData, timerCallbacks);
        window.taskManager = this.taskManager;

        this.state = {
            currentTask: null,
            nextTask: null,
            seconds: 0,
            pauseSeconds: 0,
            finishedTasks: [],
            paused: false,
        };
    }

    bindHandlers() {
        this.tickSecondHandler = this.tickSecondHandler.bind(this);
        this.pauseTickSecondHandler = this.pauseTickSecondHandler.bind(this);
        this.startTaskHandler = this.startTaskHandler.bind(this);
        this.stopTaskHandler = this.stopTaskHandler.bind(this);
        this.stopHandler = this.stopHandler.bind(this);
        this.togglePauseHandler = this.togglePauseHandler.bind(this);
    }

    startTaskHandler(currentTask, nextTask) {
        this.setState({
            seconds: 0,
            pauseSeconds: 0,
            currentTask: currentTask,
            nextTask: nextTask,
            paused: false,
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
        if (definitions.PLAY_AUDIO) {
            let audio = definitions.AUDIO_MAP[event];
            audio.play()
        }
    }

    stopTaskHandler(timeStats) {
        this.audioCallback('stop');

        let newFinishedTasks = [{
            task: this.state.currentTask,
            timeStats: timeStats,
        }].concat(deepCopy(this.state.finishedTasks));

        this._finishedTasks = newFinishedTasks;
        this.setState({
            finishedTasks: newFinishedTasks,
        })
    }

    togglePauseHandler() {
        this.setState({
            paused: !this.state.paused,
        });
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
            pauseSeconds: seconds,
        })
    }

    stopHandler() {
        // use reference to finishedTasks because React batches state updates from events
        let copyOfFinishedTasks = deepCopy(this._finishedTasks);
        this.props.finishCallback(this.props.nextState, copyOfFinishedTasks);
    }

    componentDidMount() {
        this.taskManager.subscribe('taskManager:startTask', this.startTaskHandler);
        this.taskManager.subscribe('taskManager:stopTask', this.stopTaskHandler);
        this.taskManager.subscribe('taskManager:stop', this.stopHandler);
        this.taskManager.subscribe('taskManager:togglePause', this.togglePauseHandler);
        this.taskManager.start();
    }

    componentWillUnmount() {
        this.taskManager.unsubscribe('taskManager:startTask', this.startTaskHandler);
        this.taskManager.unsubscribe('taskManager:stopTask', this.stopTaskHandler);
        this.taskManager.unsubscribe('taskManager:stop', this.stopHandler);
        this.taskManager.unsubscribe('taskManager:togglePause', this.togglePauseHandler);
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
        let displayedSeconds;
        let timerDisplayClasses = ['timer-display'];
        if (this.state.paused) {
            timerDisplayClasses.push('paused');
            displayedSeconds = this.state.pauseSeconds;
        } else if (this.state.currentTask.type === definitions.TASK_CHOICES.TIMER) {
            displayedSeconds = this.state.currentTask.timer - this.state.seconds;
        } else {
            displayedSeconds = this.state.seconds;
        }

        return <div className={timerDisplayClasses.join(' ')}>
            <div className="time">{formatZeroPadSeconds(displayedSeconds)}</div>
            {this.renderPassedOrRemainingTime()}
            {this.renderTimerControls()}
        </div>
    }

    renderPassedOrRemainingTime() {
        if (!this.state.paused) {
            return null;
        }
        let icon = null,
            seconds = null;
        if (this.state.currentTask.type === definitions.TASK_CHOICES.TIMER) {
            icon = <FontAwesome name="hourglass-start" className="vertical-aligned"/>;
            seconds = this.state.currentTask.timer - this.state.seconds;
        } else {
            icon = <FontAwesome name="clock-o" className="vertical-aligned"/>;
            seconds = this.state.seconds;
        }

        return <div className="second-time">
            {icon} <span className="vertical-aligned">{formatZeroPadSeconds(seconds)}</span>
        </div>
    }

    renderNextTask() {
        if (this.state.nextTask === null) {
            return <div className="next-task">
                <h4>
                    <FontAwesome name="arrow-right" className="next-task-glyph"/>
                    <span className="vertical-aligned">End</span>
                </h4>
            </div>
        }
        return <div className="next-task">
            <h4>
                <FontAwesome name="arrow-right" className="next-task-glyph"/>
                <span className="vertical-aligned">{this.state.nextTask.title}</span>
            </h4>
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
        let pauseGlyphName = this.state.paused ? 'play' : 'pause';

        return <div className="timer-controls">
            <a onClick={() => this.taskManager.togglePause()}>
                <FontAwesome name={pauseGlyphName}/>
            </a>
            <a onClick={() => this.taskManager.stop()}>
                <FontAwesome name="step-forward"/>
            </a>
            <a onClick={() => this.taskManager.finish()}>
                <FontAwesome name="stop"/>
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
        return <div className="container">
            {this.renderTimerDisplay()}
            {this.renderTitle()}
            {this.renderNextTask()}
            {this.renderFinishedTasks()}
        </div>
    }
}
