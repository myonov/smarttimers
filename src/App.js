import React from 'react';
import Modal from 'react-modal';
import './App.css'

const ID_LENGTH = 10;

const TASK_CHOICES = {
    TIMER: 'timer',
    STOPWATCH: 'stopwatch',
    REPEAT: 'repeat',
};

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

function findTaskList(taskList, node) {
    if (node == null) {
        return taskList;
    }

    for (let i = 0; i < taskList.length; ++i) {
        let task = taskList[i];
        if (task.type === TASK_CHOICES.REPEAT) {
            if (task.id === node.id) {
                return task.taskList;
            } else {
                let result = findTaskList(task.taskList, node);
                if (result !== undefined) {
                    return result;
                }
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

function insertIntoTaskList(startList, node, task) {
    let taskList = findTaskList(startList, node);
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

const DEFAULT_MODAL_SELECTED_OPTION = TASK_CHOICES.TIMER;

function ActionList(props) {
    let {task, taskListNode, callbacks} = props;

    return <div className="actionList">
        <div className="navigation">
            {props.canMoveUp ?
                <a onClick={() => callbacks.moveTaskUp(taskListNode, task.id)}>Up</a> :
                null}
            {props.canMoveDown ?
                <a onClick={() => callbacks.moveTaskDown(taskListNode, task.id)}>Down</a> :
                null}
        </div>
        <div>
            <a onClick={() => callbacks.removeTask(taskListNode, task.id)}>
                Remove
            </a>
            <a onClick={() => callbacks.openEditModal(taskListNode, task.id)}>
                Edit
            </a>
        </div>
    </div>
}

function TaskList(props) {
    let {containerClassName, taskListNode, taskList, callbacks} = props;

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
        <h3>{task.title}</h3>
        <h4>Duration: {task.timer}</h4>
        {actionList}
    </div>
}

function StopwatchComponent(props) {
    let {task, actionList} = props;

    return <div className="component stopwatch-component">
        <h3>{task.title}</h3>
        {actionList}
    </div>
}

function RepeatComponent(props) {
    let {task, actionList, callbacks} = props;

    return <div className="component repeat-component">
        <h3>{task.title}</h3>
        <h4>Repeat: {task.repeat}</h4>
        {actionList}

        <TaskList
            containerName="repeat-container"
            taskList={task.taskList}
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
        taskListNode={taskListNode}
        callbacks={callbacks}
        actionList={actionList}/>
}

class App extends React.Component {
    constructor() {
        super();

        this.initUrlHash();

        this.state = {
            taskList: this.initialTaskList,
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

        let initialTaskList = [];
        if (locationHash.length > 0) {
            try {
                initialTaskList = decodeToArray(locationHash);
            } catch (_) {
                initialTaskList = [];
            }
        }
        let initialExport = encodeArray(initialTaskList);

        this.initialTaskList = initialTaskList;
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
        let taskList = [];
        let properties = {
            title: this.state.modalTaskName,
            repeat: repeatCycles(this.state.modalRepeatInput),
        };

        if (!this.isEditMode()) {
            properties[taskList] = [];
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

    changeTaskList(newTaskList) {
        let exported = encodeArray(newTaskList);
        this.setState({
            taskList: newTaskList,
            exportUrl: exported,
        }, () => window.location.hash=exported);
    }

    addTask() {
        let taskObj = this.createTask();
        let modifiedTaskList = deepCopy(this.state.taskList);
        insertIntoTaskList(modifiedTaskList, this.state.addPlaceNode, taskObj);
        this.changeTaskList(modifiedTaskList);
    }

    editTask() {
        let modifiedTaskList = deepCopy(this.state.taskList);
        let listToChange = findTaskList(modifiedTaskList, this.state.addPlaceNode);
        let taskIndex = findTaskIndexById(listToChange, this.state.editedTaskId);
        let properties = this.getTaskProperties();
        listToChange[taskIndex] = Object.assign(listToChange[taskIndex], properties);
        this.changeTaskList(modifiedTaskList);
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

    moveTaskUp(taskListNode, taskId) {
        let modifiedTaskList = deepCopy(this.state.taskList);
        let listToChange = findTaskList(modifiedTaskList, taskListNode);
        let index = findTaskIndexById(listToChange, taskId);
        swapMove(listToChange, index - 1, index);
        this.changeTaskList(modifiedTaskList);
    }

    moveTaskDown(taskListNode, taskId) {
        let modifiedTaskList = deepCopy(this.state.taskList);
        let listToChange = findTaskList(modifiedTaskList, taskListNode);
        let index = findTaskIndexById(listToChange, taskId);
        swapMove(listToChange, index, index + 1);
        this.changeTaskList(modifiedTaskList);
    }

    removeTask(taskListNode, taskId) {
        let modifiedTaskList = deepCopy(this.state.taskList);
        let listToChange = findTaskList(modifiedTaskList, taskListNode);
        let index = findTaskIndexById(listToChange, taskId);
        listToChange.splice(index, 1);
        this.changeTaskList(modifiedTaskList);
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

    render() {
        return (
            <div className="container">
                <h3>Task List</h3>
                <TaskList
                    containerClassName="main-tasklist"
                    taskList={this.state.taskList}
                    taskListNode={null}
                    callbacks={{
                        openModal: this.openModal,
                        moveTaskUp: this.moveTaskUp,
                        moveTaskDown: this.moveTaskDown,
                        removeTask: this.removeTask,
                        openEditModal: this.openEditModal,
                    }}/>

                <Modal
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
            </div>
        );
    }
}

export default App;
