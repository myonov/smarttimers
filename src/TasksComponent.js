import React from 'react';
import Modal from 'react-modal';
import FontAwesome from 'react-fontawesome';
import './TasksComponent.css'

const ID_LENGTH = 10;

const TASK_CHOICES = {
    TIMER: 'timer',
    STOPWATCH: 'stopwatch',
    REPEAT: 'repeat',
};

const DEFAULT_MODAL_SELECTED_OPTION = TASK_CHOICES.TIMER;

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

function timeStringToSeconds(timeString) {
    let seconds = hmsTimeStringToSeconds(timeString) || forceParseInt(timeString);
    if (seconds === null) {
        throw new ValidationException('Invalid time string');
    }
    return seconds;
}

function repeatCycles(iString) {
    let cycles = forceParseInt(iString);
    if (cycles === null) {
        throw new ValidationException('Invalid number');
    }
    return cycles;
}

function generateId(length) {
    let result = '';
    for (let i = 0; i < length; ++i) {
        result += parseInt(Math.random() * 10, 10);
    }
    return result;
}

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function findTaskList(workNode, node) {
    let taskList = workNode.taskList;

    if (workNode.id === node.id) {
        return taskList;
    }

    for (let i = 0; i < taskList.length; ++i) {
        let task = taskList[i];
        if (task.type === TASK_CHOICES.REPEAT) {
            let result = findTaskList(task, node);
            if (result !== undefined) {
                return result;
            }
        }
    }
}

function findTaskIndexById(taskList, id) {
    for (let i = 0; i < taskList.length; ++i) {
        if (taskList[i].id === id) {
            return i;
        }
    }
}

function insertIntoTaskList(startNode, node, task) {
    let taskList = findTaskList(startNode, node);
    taskList.push(task);
}

function swapMove(taskList, index1, index2) {
    let buf = taskList[index1];
    taskList[index1] = taskList[index2];
    taskList[index2] = buf;
}

function encodeArray(arr) {
    return encodeURIComponent(JSON.stringify(arr))
}

function decodeToArray(data) {
    return JSON.parse(decodeURIComponent(data));
}

function ActionList(props) {
    let {task, taskListNode, callbacks, canMoveUp, canMoveDown} = props;

    return <div className="actionList">
        <div>
            <a onClick={() => callbacks.openEditModal(taskListNode, task.id)}>
                <FontAwesome name="pencil" />
            </a>
            <a onClick={() => callbacks.removeTask(taskListNode, task.id)}>
                <FontAwesome name="close" />
            </a>
        </div>

        <div className="navigation">
            {canMoveUp ?
                <a onClick={() => callbacks.moveTaskUp(taskListNode, task.id)}>
                    <FontAwesome name="chevron-up" />
                </a> : null}
            {canMoveDown ?
                <a onClick={() => callbacks.moveTaskDown(taskListNode, task.id)}>
                    <FontAwesome name="chevron-down" />
                </a> : null}
        </div>
    </div>
}

function TaskList(props) {
    let {containerClassName, taskListNode, callbacks} = props;
    let taskList = taskListNode.taskList;

    return (
        <div className={containerClassName}>
            <div className="task-list">
                {taskList.map(
                    (task, index) => <TaskComponent
                        task={task}
                        taskListNode={taskListNode}
                        key={task.id}
                        canMoveUp={index > 0}
                        canMoveDown={index < taskList.length - 1}
                        callbacks={callbacks} />)}
            </div>
            <div>
                <a onClick={() => callbacks.openModal(taskListNode)}>Add task</a>
            </div>
        </div>
    );
}

function TimerComponent(props) {
    let {task, actionList} = props;

    return <div className="component timer-component">
        <div className="info-container">
            <div className="info">
                <span className="title">{task.title}</span>
                <span className="duration"><FontAwesome name="clock-o" />{task.timer}</span>
                {actionList}
            </div>
        </div>
    </div>
}

function StopwatchComponent(props) {
    let {task, actionList} = props;

    return <div className="component stopwatch-component">
        <div className="info-container">
            <div className="info">
                <span className="title">{task.title}</span>
                {actionList}
            </div>
        </div>
    </div>
}

function RepeatComponent(props) {
    let {task, actionList, callbacks} = props;

    return <div className="component repeat-component">
        <div className="info-container">
            <div className="info">
                <span className="title">{task.title}</span>
                <span className="repeat">Repeat: {task.repeat}</span>
                {actionList}
            </div>
        </div>

        <TaskList
            containerName="repeat-container"
            callbacks={callbacks}
            taskListNode={task}/>
    </div>
}

function TaskComponent(props) {
    let {task, taskListNode, canMoveUp, canMoveDown, callbacks} = props;
    let actionList = <ActionList
        taskListNode={taskListNode}
        task={task}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        callbacks={callbacks}/>;

    if (task.type === TASK_CHOICES.TIMER) {
        return <TimerComponent task={task} actionList={actionList}/>
    }
    if (task.type === TASK_CHOICES.STOPWATCH) {
        return <StopwatchComponent task={task} actionList={actionList}/>
    }

    return <RepeatComponent
        task={task}
        callbacks={callbacks}
        actionList={actionList}/>
}

export default class TasksComponent extends React.Component {
    constructor() {
        super();

        this.initUrlHash();

        this.state = {
            root: this.initialRoot,
            exportUrl: this.initialExport,
            modalIsOpen: false,
            editedTaskId: null,
            modalSelectedOption: DEFAULT_MODAL_SELECTED_OPTION,
            modalTaskName: '',
            modalTimerInput: '',
            modalRepeatInput: '',
            validationErrorMessage: null,
        };

        this.bindMethods();
    }

    initUrlHash() {
        let locationHash = window.location.hash.substr(1);
        let emptyRoot = {
            id: 'root',
            taskList: [],
        };

        let initialRoot;
        if (locationHash.length > 0) {
            try {
                initialRoot = decodeToArray(locationHash);
            } catch (_) {
                initialRoot = emptyRoot;
            }
        } else {
            initialRoot = emptyRoot;
        }
        let initialExport = encodeArray(initialRoot);

        this.initialRoot = initialRoot;
        this.initialExport = initialExport;
    }

    bindMethods() {
        this.openModal = this.openModal.bind(this);
        this.moveTaskUp = this.moveTaskUp.bind(this);
        this.moveTaskDown = this.moveTaskDown.bind(this);
        this.removeTask = this.removeTask.bind(this);
        this.openEditModal = this.openEditModal.bind(this);
        this.modalAfterOpen = this.modalAfterOpen.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.modalInputChange = this.modalInputChange.bind(this);
        this.addOrEditTask = this.addOrEditTask.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    getTimerProperties() {
        return {
            title: this.state.modalTaskName,
            timer: timeStringToSeconds(this.state.modalTimerInput),
        };
    }

    getStopwatchProperties() {
        return {
            title: this.state.modalTaskName,
        };
    }

    getRepeatProperties() {
        let properties = {
            title: this.state.modalTaskName,
            repeat: repeatCycles(this.state.modalRepeatInput),
        };

        if (!this.isEditMode()) {
            properties['taskList'] = [];
        }

        return properties;
    }

    getTaskProperties() {
        if (this.state.modalSelectedOption === TASK_CHOICES.TIMER) {
            return this.getTimerProperties();
        }
        if (this.state.modalSelectedOption === TASK_CHOICES.STOPWATCH) {
            return this.getStopwatchProperties();
        }

        return this.getRepeatProperties();
    }

    createTask() {
        let task = {
            id: generateId(ID_LENGTH),
            type: this.state.modalSelectedOption,
        };
        let taskProperties = this.getTaskProperties();
        return Object.assign(task, taskProperties);
    }

    changeTaskList(newRoot) {
        let exported = encodeArray(newRoot);
        this.setState({
            root: newRoot,
            exportUrl: exported,
        }, () => window.location.hash=exported);
    }

    addTask() {
        let taskObj = this.createTask();
        let modifiedRoot = deepCopy(this.state.root);
        insertIntoTaskList(modifiedRoot, this.state.addPlaceNode, taskObj);
        this.changeTaskList(modifiedRoot);
    }

    addOrEditTask() {
        if (!this.validate()) {
            return;
        }

        if (this.state.editedTaskId === null) {
            this.addTask();
        } else {
            this.editTask();
        }

        this.closeModal();
    }

    openModal(taskListNode) {
        this.setState({
            addPlaceNode: taskListNode,
            modalIsOpen: true,
        });
    }

    closeModal() {
        this.setState({
            addPlaceNode: null,
            modalTaskName: '',
            modalSelectedOption: DEFAULT_MODAL_SELECTED_OPTION,
            modalTimerInput: '',
            modalRepeatInput: '',
            modalIsOpen: false,
            editedTaskId: null,
            validationErrorMessage: null,
        });
    }

    modalInputChange(input, e) {
        let newState = {};
        newState[input] = e.target.value;
        this.setState(newState);
    }

    modalAfterOpen() {
        this.input.focus();
    }

    renderModalSelectedOptionProperties() {
        if (this.state.modalSelectedOption === TASK_CHOICES.STOPWATCH) {
            return null;
        }
        if (this.state.modalSelectedOption === TASK_CHOICES.TIMER) {
            return <input
                onChange={(e) => this.modalInputChange('modalTimerInput', e)}
                value={this.state.modalTimerInput}/>
        }
        return <input
            onChange={(e) => this.modalInputChange('modalRepeatInput', e)}
            value={this.state.modalRepeatInput}/>
    }

    _transformTaskList(taskListNode, taskId, transformCallback) {
        let modifiedRoot = deepCopy(this.state.root);
        let listToChange = findTaskList(modifiedRoot, taskListNode);
        let index = findTaskIndexById(listToChange, taskId);
        transformCallback(listToChange, index);
        this.changeTaskList(modifiedRoot);
    }

    moveTaskUp(taskListNode, taskId) {
        this._transformTaskList(taskListNode, taskId,
            (listToChange, index) => swapMove(listToChange, index - 1, index));
    }

    moveTaskDown(taskListNode, taskId) {
        this._transformTaskList(taskListNode, taskId,
            (listToChange, index) => swapMove(listToChange, index, index + 1));
    }

    removeTask(taskListNode, taskId) {
        this._transformTaskList(taskListNode, taskId,
            (listToChange, index) => listToChange.splice(index, 1));
    }

    editTask() {
        this._transformTaskList(this.state.addPlaceNode, this.state.editedTaskId,
            (listToChange, index) => {
                let properties = this.getTaskProperties();
                listToChange[index] = Object.assign(listToChange[index], properties);
            });
    }

    openEditModal(taskListNode, taskId) {
        let actualTaskList;
        if (taskListNode === null) {
            actualTaskList = this.state.taskList;
        } else {
            actualTaskList = taskListNode.taskList;
        }
        let index = findTaskIndexById(actualTaskList, taskId);
        let task = actualTaskList[index];

        this.setState({
            addPlaceNode: taskListNode,
            modalTaskName: task.title,
            modalSelectedOption: task.type,
            modalTimerInput: task.type === TASK_CHOICES.TIMER ? task.timer : '',
            modalRepeatInput: task.type === TASK_CHOICES.REPEAT ? task.repeat : '',
            editedTaskId: task.id,
        });

        this.openModal(taskListNode);
    }

    isEditMode() {
        return this.state.editedTaskId !== null;
    }

    validate() {
        try {
            this.createTask();
            return true;
        } catch (e) {
            this.setState({
                validationErrorMessage: e.message,
            });
        }
        return false;
    }

    renderValidationErrors() {
        if (!this.state.validationErrorMessage) {
            return null;
        }
        return <div className="error-message">
            {this.state.validationErrorMessage}
        </div>
    }

    renderModal() {
        return <Modal
            isOpen={this.state.modalIsOpen}
            onAfterOpen={this.modalAfterOpen}
            onRequestClose={this.closeModal}
            contentLabel={this.isEditMode() ? 'Edit task' : 'Add task'}>
            <div>
                <input
                    onChange={(e) => this.modalInputChange('modalTaskName', e)}
                    ref={input => this.input = input} value={this.state.modalTaskName}/>
                <select
                    value={this.state.modalSelectedOption}
                    onChange={(e) => this.modalInputChange('modalSelectedOption', e)}
                    disabled={this.isEditMode()}>

                    <option value={TASK_CHOICES.TIMER}>Timer</option>
                    <option value={TASK_CHOICES.STOPWATCH}>Stopwatch</option>
                    <option value={TASK_CHOICES.REPEAT}>Repeat</option>
                </select>
                {this.renderModalSelectedOptionProperties()}
                {this.renderValidationErrors()}
                <button onClick={this.addOrEditTask}>OK</button>
                <button onClick={this.closeModal}>Cancel</button>
            </div>
        </Modal>
    }

    render() {
        return (
            <div className="container">
                <h3>Task List</h3>
                <TaskList
                    containerClassName="main-tasklist"
                    taskListNode={this.state.root}
                    callbacks={{
                        openModal: this.openModal,
                        moveTaskUp: this.moveTaskUp,
                        moveTaskDown: this.moveTaskDown,
                        removeTask: this.removeTask,
                        openEditModal: this.openEditModal,
                    }}/>

                {this.renderModal()}
            </div>
        );
    }
}
