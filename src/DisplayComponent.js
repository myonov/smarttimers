import React from 'react';
import FontAwesome from 'react-fontawesome';

import {TaskManager} from './TaskManager';
import {
    deepCopy,
    formatTimeFromSeconds,
    formatZeroPadSeconds,
    getIconByTaskType,
    renderFinishedTasks,
} from './utils';

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

        this._finishedTasks = [];
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

    startTaskHandler(currentTask, nextTask, progressInfo) {
        this.setState({
            seconds: 0,
            pauseSeconds: 0,
            currentTask: currentTask,
            nextTask: nextTask,
            progressInfo: progressInfo,
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

    renderDescriptions() {
        let title = this.state.currentTask.title;

        return <h3 className="task-title">
            <span className="left-side current-task-description">
                {getIconByTaskType(this.state.currentTask.type, 'vertical-aligned')}
                <span className="vertical-aligned">{title}</span>
            </span>
            <span>
                {this.renderProgress()}
            </span>
            <span className="right-side">
                {this.renderNextTask()}
            </span>
        </h3>
    }

    renderTimerDisplay() {
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

    renderProgress() {
        if (this.state.progressInfo === null) {
            return null;
        }
        return <span className="progress">
            <span className="percent">
                {this.state.progressInfo.isRemainingTimeKnown ? '' : '\u2264'}
                {this.state.progressInfo.percent}%
            </span>
            <span className="tasks">
                {this.state.progressInfo.currentTaskIndex}/{this.state.progressInfo.tasksCount}
            </span>
        </span>
    }

    getTimeForDisplay() {
        let seconds = null;
        if (this.state.currentTask.type === definitions.TASK_CHOICES.TIMER) {
            seconds = this.state.currentTask.timer - this.state.seconds;
        } else {
            seconds = this.state.seconds;
        }
        return seconds;
    }

    renderPassedOrRemainingTime() {
        if (!this.state.paused) {
            return null;
        }

        return <div className="second-time">
            {getIconByTaskType(this.state.currentTask.type, 'vertical-aligned')}
            <span
                className="vertical-aligned">{formatZeroPadSeconds(this.getTimeForDisplay())}</span>
        </div>
    }

    renderNextTask() {
        if (this.state.nextTask === null) {
            return <span className="next-task">
                <FontAwesome name="arrow-right" className="next-task-glyph"/>
                <span className="vertical-aligned">End</span>
            </span>
        }
        let duration = null;
        if (this.state.nextTask !== null &&
            this.state.nextTask.type === definitions.TASK_CHOICES.TIMER) {
            duration = <span className="vertical-aligned">
                {formatTimeFromSeconds(this.state.nextTask.timer)}
            </span>
        }
        return <span className="next-task">
                <FontAwesome name="arrow-right" className="next-task-glyph"/>
            {getIconByTaskType(this.state.nextTask.type, 'vertical-aligned')}
            <span className="vertical-aligned">{this.state.nextTask.title}</span>
            {duration}
            </span>
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
        return renderFinishedTasks(this.state.finishedTasks);
    }

    render() {
        if (this.state.currentTask === null) {
            return null;
        }
        return <div className="container">
            {this.renderTimerDisplay()}
            {this.renderDescriptions()}
            {this.renderFinishedTasks()}
        </div>
    }
}
