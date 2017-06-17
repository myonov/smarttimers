import React from 'react';
import FontAwesome from 'react-fontawesome';
import * as definitions from './definitions';

function ValidationException(message) {
    this.message = message;
    this.name = 'ValidationException';
}

function forceParseInt(iString) {
    let intRegex = /^([0-9]+)$/;

    let matches = intRegex.exec(iString);
    if (matches === null) {
        return null;
    }
    return parseInt(iString, 10);
}

function hmsTimeStringToSeconds(hmsTimeString) {
    let hmsRegex = /^([0-9]+h)?([0-9]+m)?([0-9]+s)?$/;
    let factor = {
        s: 1,
        m: 60,
        h: 60 * 60,
    };

    let matches = hmsRegex.exec(hmsTimeString);
    if (matches === null) {
        return null;
    }

    let result = 0;
    for (let i = 1; i < matches.length; ++i) {
        for (let j in factor) {
            if (matches[i] && matches[i][matches[i].length - 1] === j) {
                result += parseInt(matches[i].substring(0, matches[i].length - 1), 10) * factor[j];
            }
        }
    }

    return result;
}

export function hasElementParentWithClass(el, className) {
    if (el.classList && el.classList.contains(className)) return true;
    return el.parentNode && hasElementParentWithClass(el.parentNode, className);
}

export function formatTimeFromSeconds(timeInSeconds) {
    let hours = parseInt(timeInSeconds / (60 * 60), 10);
    let minutes = parseInt(timeInSeconds / 60, 10) % 60;
    let seconds = timeInSeconds % 60;

    return hours + 'h' + minutes + 'm' + seconds + 's';
}

export function timeStringToSeconds(timeString) {
    let seconds = hmsTimeStringToSeconds(timeString) || forceParseInt(timeString);
    if (seconds === null) {
        throw new ValidationException('Invalid time string');
    }
    return seconds;
}

export function repeatCycles(iString) {
    let cycles = forceParseInt(iString);
    if (cycles === null) {
        throw new ValidationException('Invalid number');
    }
    return cycles;
}

export function generateId(length) {
    let result = '';
    for (let i = 0; i < length; ++i) {
        result += parseInt(Math.random() * 10, 10);
    }
    return result;
}

export function encodeArray(arr) {
    return encodeURIComponent(JSON.stringify(arr))
}

export function decodeToArray(data) {
    return JSON.parse(decodeURIComponent(data));
}

export function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function zeroPad(num) {
    if (num < 10) {
        return '0' + num;
    }
    return '' + num;
}

export function formatZeroPadSeconds(timeInSeconds) {
    let hours = parseInt(timeInSeconds / (60 * 60), 10);
    let minutes = parseInt(timeInSeconds / 60, 10) % 60;
    let seconds = timeInSeconds % 60;

    return zeroPad(hours) + ':' + zeroPad(minutes) + ':' + zeroPad(seconds);
}

export function initAudio(audioMap) {
    for (let key in audioMap) {
        if (!audioMap.hasOwnProperty(key)) continue;
        let audio = audioMap[key];
        audio.volume = 0;
        audio.addEventListener('ended', function () {
            this.volume = 1;
        });
        audio.play();
    }
}


export function getIconByTaskType(taskType, classNames = '') {
    let icon = null;
    if (taskType === definitions.TASK_CHOICES.TIMER) {
        icon = <FontAwesome name="hourglass-start" className={classNames}/>;
    } else {
        icon = <FontAwesome name="clock-o" className={classNames}/>;
    }
    return icon;
}

export function getSecondsForDisplay(taskType, elapsed) {
    let seconds = null;
    if (taskType === definitions.TASK_CHOICES.TIMER) {
        seconds = this.state.currentTask.timer - this.state.seconds;
    } else {
        seconds = this.state.seconds;
    }
    return seconds;
}

export function renderFinishedTask(item) {
    return <li className="finished-task">
        <h4>
            <span className="title">
                {getIconByTaskType(item.task.type)}
                {item.task.title}
            </span>
            <span className="running-time">
                {item.timeStats.runningTime}
            </span>
            <span className="paused-time">
                {item.timeStats.pausedTime}
            </span>
        </h4>
    </li>
}
