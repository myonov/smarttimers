import React from "react";
import Modal from "react-modal";
import Dragula from "react-dragula";
import FontAwesome from "react-fontawesome";
import "./TasksComponent.css";

const ID_LENGTH = 10;

const TASK_CHOICES = {
    TIMER: 'timer',
    STOPWATCH: 'stopwatch',
    REPEAT: 'repeat',
};

const DEFAULT_MODAL_SELECTED_OPTION = TASK_CHOICES.TIMER;

const customStyles = {
    overlay: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)'
    },
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        transform: 'translate(-50%, -50%)',
        border: '1px solid #bbb',
        padding: '20px',
        borderRadius: '0px',
    }
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

function formatTimeFromSeconds(timeInSeconds) {
    let hours = parseInt(timeInSeconds / (60 * 60), 10);
    let minutes = parseInt(timeInSeconds / 60, 10) % 60;
    let seconds = timeInSeconds % 60;

    return hours + 'h' + minutes + 'm' + seconds + 's';
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

function encodeArray(arr) {
    return encodeURIComponent(JSON.stringify(arr))
}

function decodeToArray(data) {
    return JSON.parse(decodeURIComponent(data));
}

class TaskList extends React.Component {
    render() {
        let {containerClassName, taskListNode, callbacks} = this.props;
        let taskList = taskListNode.taskList;
        let listToBeSorted = taskList.map(
            (task) => {
                return <TaskComponent
                    task={task}
                    taskListNode={taskListNode}
                    key={task.id}
                    callbacks={callbacks}/>
            });
        return (
            <div className={containerClassName}>
                <div className="task-list"
                     ref={this.dragulaDecorator}
                     data-task-list-node={taskListNode.id}>
                    {listToBeSorted}
                </div>
                <div className="centered">
                    <a className="button"
                       onClick={() => callbacks.openModal(taskListNode)}>
                        <FontAwesome name="plus"/>
                        Add task
                    </a>
                </div>
            </div>
        );
    }

    dragulaDecorator = (componentInstance) => {
        if (componentInstance) {
            let options = {};
            let drake = Dragula([componentInstance], options);
            drake.on('drop', (el, target, source, sibling) => {
                let taskListNodeId = target.dataset.taskListNode;
                let sortedIds = [];
                for (let child of target.children) {
                    sortedIds.push(child.dataset.taskId);
                }
                this.props.callbacks.sortList(taskListNodeId, sortedIds);
            });
        }
    }
}

function TaskDescription(props) {
    let {callbacks, taskListNode, task} = props;
    return <span className="title">
        <a onClick={() => callbacks.openEditModal(taskListNode, task.id)}>
            {task.title}
        </a>
    </span>
}

function TimerComponent(props) {
    let {task, taskDescription} = props;

    return <div className="component timer-component" data-task-id={task.id}>
        <div className="info-container">
            <div className="info">
                {taskDescription}
                <span className="duration">
                    <FontAwesome name="hourglass-start"/>
                    {formatTimeFromSeconds(task.timer)}
                </span>
            </div>
        </div>
    </div>
}

function StopwatchComponent(props) {
    let {task, taskDescription} = props;

    return <div className="component stopwatch-component" data-task-id={task.id}>
        <div className="info-container">
            <div className="info">
                {taskDescription}
                <span className="stopwatch">
                    <FontAwesome name="clock-o"/>
                </span>
            </div>
        </div>
    </div>
}

function RepeatComponent(props) {
    let {task, taskDescription, callbacks} = props;

    return <div className="component repeat-component"
                data-task-id={task.id}>
        <div className="info-container">
            <div className="info">
                {taskDescription}
                <span className="repeat">
                    <FontAwesome name="repeat"/> {task.repeat}
                </span>
            </div>
        </div>

        <TaskList
            containerName="repeat-container"
            callbacks={callbacks}
            taskListNode={task}/>
    </div>
}

function TaskComponent(props) {
    let {task, taskListNode, callbacks} = props;
    let taskDescription = <TaskDescription
        task={task}
        taskListNode={taskListNode}
        callbacks={callbacks}/>;

    if (task.type === TASK_CHOICES.TIMER) {
        return <TimerComponent task={task} taskDescription={taskDescription}/>
    }
    if (task.type === TASK_CHOICES.STOPWATCH) {
        return <StopwatchComponent task={task} taskDescription={taskDescription}/>
    }

    return <RepeatComponent
        task={task}
        taskDescription={taskDescription}
        callbacks={callbacks}/>
}

export default class TasksComponent extends React.Component {
    constructor(props) {
        super(props);

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
        this.removeTask = this.removeTask.bind(this);
        this.openEditModal = this.openEditModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.modalInputChange = this.modalInputChange.bind(this);
        this.addOrEditTask = this.addOrEditTask.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.transferAction = this.transferAction.bind(this);
        this.sortList = this.sortList.bind(this);
        this._deleteTask = this._deleteTask.bind(this);
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
        }, () => window.location.hash = exported);
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

    renderModalSelectedOptionProperties() {
        if (this.state.modalSelectedOption === TASK_CHOICES.STOPWATCH) {
            return null;
        }
        if (this.state.modalSelectedOption === TASK_CHOICES.TIMER) {
            return <input
                placeholder="time string"
                onChange={(e) => this.modalInputChange('modalTimerInput', e)}
                value={this.state.modalTimerInput}/>
        }
        return <input
            placeholder="repeats"
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

    sortList(taskListNodeId, sortedListIds) {
        let modifiedRoot = deepCopy(this.state.root);
        let listToChange = findTaskList(modifiedRoot, {id: taskListNodeId});
        let mappedTasks = {};
        for (let task of listToChange) {
            mappedTasks[task.id] = task;
        }
        for (let i = 0; i < sortedListIds.length; ++i) {
            let taskId = sortedListIds[i];
            let task = mappedTasks[taskId];
            listToChange[i] = task;
        }
        this.changeTaskList(modifiedRoot);
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
            modalTimerInput: task.type === TASK_CHOICES.TIMER ?
                formatTimeFromSeconds(task.timer) : '',
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

    transferAction() {
        let data = deepCopy(this.state.root);
        this.props.startCallback(data);
    }

    renderValidationErrors() {
        if (!this.state.validationErrorMessage) {
            return null;
        }
        return <div className="error-message">
            {this.state.validationErrorMessage}
        </div>
    }

    _deleteTask() {
        let taskListNode = this.state.addPlaceNode;
        let taskId = this.state.editedTaskId;

        if (confirm('Are you sure you want to delete this task?')) {
          this.closeModal();
          this.removeTask(taskListNode, taskId);
        }
    }

    renderRemoveItem() {
        if (!this.isEditMode()) {
            return null;
        }

        return <a className="remove-task"
                  onClick={this._deleteTask}>
            <FontAwesome name="trash"/>
        </a>
    }

    renderStartButton() {
        if (this.state.root.taskList.length === 0) {
            return null;
        }
        return <div className="centered start-container">
            <a className="button" onClick={this.transferAction}>
                <FontAwesome name="play"/>Start
            </a>
        </div>
    }

    renderModal() {
        return <Modal
            isOpen={this.state.modalIsOpen}
            onAfterOpen={this.modalAfterOpen}
            onRequestClose={this.closeModal}
            contentLabel={this.isEditMode() ? 'Edit task' : 'Add task'}
            style={customStyles}>
            <div className="modal-content">
                <input
                    placeholder="name"
                    autoFocus="autoFocus"
                    onChange={(e) => this.modalInputChange('modalTaskName', e)}
                    value={this.state.modalTaskName}/>
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
                {this.renderRemoveItem()}
                <a onClick={this.addOrEditTask} className="button">OK</a>
                <a onClick={this.closeModal} className="button">Cancel</a>
            </div>
        </Modal>
    }

    render() {
        return (
            <div className="container">
                <h3 className="centered main-title">Task List</h3>
                {this.renderStartButton()}
                <TaskList
                    containerClassName="main-tasklist"
                    taskListNode={this.state.root}
                    data-task-list-node={this.state.root.id}
                    callbacks={{
                        openModal: this.openModal,
                        openEditModal: this.openEditModal,
                        sortList: this.sortList,
                    }}/>

                {this.renderModal()}
            </div>
        );
    }
}
