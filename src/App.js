import React from 'react';
import Modal from 'react-modal';
import './App.css'

const ID_LENGTH = 10;

const CHOICES = {
    TIMER: 'timer',
    STOPWATCH: 'stopwatch',
    REPEAT: 'repeat',
};

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
        if (task.type === CHOICES.REPEAT) {
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

const DEFAULT_MODAL_SELECTED_OPTION = CHOICES.TIMER;

function ActionList(props) {
    let moveUp = null;
    if (props.canMoveUp) {
        moveUp = <a onClick={() => props.moveTaskUp(props.taskListNode, props.index)}>Up</a>;
    }
    let moveDown = null;
    if (props.canMoveDown) {
        moveDown = <a onClick={() => props.moveTaskDown(props.taskListNode, props.index)}>Down</a>;
    }
    return <div className="actionList">
        <div className="navigation">
            {moveUp}
            {moveDown}
        </div>
        <div>
            <a onClick={() => props.removeTask(props.taskListNode, props.index)}>
                Remove
            </a>
            <a onClick={() => props.openEditModal(props.taskListNode, props.index)}>
                Edit
            </a>
        </div>
    </div>
}

function TaskList(props) {
    let containerClassName = props.containerClassName || '';
    let taskListNode = props.taskListNode;

    return (
        <div className={containerClassName}>
            <div className="task-list">
                {props.taskList.map(
                    (task, index) => <TaskComponent
                        index={index}
                        task={task}
                        taskListNode={taskListNode}
                        key={task.id}
                        canMoveUp={index > 0}
                        canMoveDown={index < props.taskList.length - 1}
                        moveTaskUp={props.moveTaskUp}
                        moveTaskDown={props.moveTaskDown}
                        removeTask={props.removeTask}
                        openEditModal={props.openEditModal}
                        openModal={props.openModal}/>)}
            </div>
            <div>
                <a onClick={() => props.openModal(taskListNode)}>Add task</a>
            </div>
        </div>
    );
}

function TimerComponent(props) {
    let task = props.task;

    return <div className="component timer-component">
        <h3>{task.title}</h3>
        <h4>Duration: {task.timer}</h4>
        {props.actionList}
    </div>
}

function StopwatchComponent(props) {
    let task = props.task;

    return <div className="component stopwatch-component">
        <h3>{task.title}</h3>
        {props.actionList}
    </div>
}

function RepeatComponent(props) {
    let task = props.task;

    return <div className="component repeat-component">
        <h3>{task.title}</h3>
        <h4>Repeat: {task.repeat}</h4>
        {props.actionList}

        <TaskList
            taskList={task.taskList}
            openModal={props.openModal}
            moveTaskUp={props.moveTaskUp}
            moveTaskDown={props.moveTaskDown}
            removeTask={props.removeTask}
            openEditModal={props.openEditModal}
            taskListNode={task}/>
    </div>
}

function TaskComponent(props) {
    let task = props.task;
    let actionList = <ActionList
        canMoveUp={props.canMoveUp}
        canMoveDown={props.canMoveDown}
        moveTaskUp={props.moveTaskUp}
        moveTaskDown={props.moveTaskDown}
        index={props.index}
        taskListNode={props.taskListNode}
        removeTask={props.removeTask}
        openEditModal={props.openEditModal}/>;

    if (task.type === CHOICES.TIMER) {
        return <TimerComponent task={task} actionList={actionList}/>
    }
    if (task.type === CHOICES.STOPWATCH) {
        return <StopwatchComponent task={task} actionList={actionList}/>
    }
    return <RepeatComponent {...props} actionList={actionList}/>
}

class App extends React.Component {
    constructor() {
        super();

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

        this.state = {
            taskList: initialTaskList,
            exportUrl: initialExport,
            modalIsOpen: false,
            editedTaskId: null,
            modalSelectedOption: DEFAULT_MODAL_SELECTED_OPTION,
            modalTaskName: '',
            modalTimerInput: '',
            modalRepeatInput: '',
        };
    }

    createTimerTask() {
        return {
            id: generateId(ID_LENGTH),
            type: CHOICES.TIMER,
            title: this.state.modalTaskName,
            timer: this.state.modalTimerInput,
        };
    }

    createStopwatchTask() {
        return {
            id: generateId(ID_LENGTH),
            type: CHOICES.STOPWATCH,
            title: this.state.modalTaskName,
        };
    }

    createRepeatTask() {
        return {
            id: generateId(ID_LENGTH),
            type: CHOICES.REPEAT,
            title: this.state.modalTaskName,
            repeat: this.state.modalRepeatInput,
            taskList: [],
        };
    }

    createTask() {
        if (this.state.modalSelectedOption === CHOICES.TIMER) {
            return this.createTimerTask();
        }
        if (this.state.modalSelectedOption === CHOICES.STOPWATCH) {
            return this.createStopwatchTask();
        }
        return this.createRepeatTask();
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
        let task = this.createTask();

        task.id = this.state.editedTaskId;
        listToChange[taskIndex] = task;
        this.changeTaskList(modifiedTaskList);
    }

    addOrEditTask() {
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
        if (this.state.modalSelectedOption === CHOICES.STOPWATCH) {
            return null;
        }
        if (this.state.modalSelectedOption === CHOICES.TIMER) {
            return <input
                onChange={this.modalInputChange.bind(this, 'modalTimerInput')}
                value={this.state.modalTimerInput}/>
        }
        return <input
            onChange={this.modalInputChange.bind(this, 'modalRepeatInput')}
            value={this.state.modalRepeatInput}/>
    }

    moveTaskUp(taskListNode, index) {
        let modifiedTaskList = deepCopy(this.state.taskList);
        let listToChange = findTaskList(modifiedTaskList, taskListNode);
        swapMove(listToChange, index - 1, index);
        this.changeTaskList(modifiedTaskList);
    }

    moveTaskDown(taskListNode, index) {
        let modifiedTaskList = deepCopy(this.state.taskList);
        let listToChange = findTaskList(modifiedTaskList, taskListNode);
        swapMove(listToChange, index, index + 1);
        this.changeTaskList(modifiedTaskList);
    }

    removeTask(taskListNode, index) {
        let modifiedTaskList = deepCopy(this.state.taskList);
        let listToChange = findTaskList(modifiedTaskList, taskListNode);
        listToChange.splice(index, 1);
        this.changeTaskList(modifiedTaskList);
    }

    openEditModal(taskListNode, index) {
        let task;
        if (taskListNode === null) {
            task = this.state.taskList[index];
        } else {
            task = taskListNode.taskList[index];
        }
        console.log(task);

        this.setState({
            addPlaceNode: taskListNode,
            modalTaskName: task.title,
            modalSelectedOption: task.type,
            modalTimerInput: task.type === CHOICES.TIMER ? task.timer : '',
            modalRepeatInput: task.type === CHOICES.REPEAT ? task.repeat : '',
            editedTaskId: task.id,
        });

        this.openModal(taskListNode);
    }

    isEditMode() {
        return this.state.editedTaskId !== null;
    }

    render() {
        return (
            <div className="container">
                <h3>Task List</h3>
                <TaskList
                    containerClassName="main-tasklist"
                    taskList={this.state.taskList}
                    openModal={this.openModal.bind(this)}
                    moveTaskUp={this.moveTaskUp.bind(this)}
                    moveTaskDown={this.moveTaskDown.bind(this)}
                    taskListNode={null}
                    removeTask={this.removeTask.bind(this)}
                    openEditModal={this.openEditModal.bind(this)}/>

                <Modal
                    isOpen={this.state.modalIsOpen}
                    onAfterOpen={this.modalAfterOpen.bind(this)}
                    onRequestClose={this.closeModal.bind(this)}
                    contentLabel={this.isEditMode() ? 'Edit task' : 'Add task'}>
                    <div>
                        <input
                            onChange={this.modalInputChange.bind(this, 'modalTaskName')}
                            ref={input => this.input = input} value={this.state.modalTaskName}/>
                        <select
                            value={this.state.modalSelectedOption}
                            onChange={this.modalInputChange.bind(this, 'modalSelectedOption')}
                            disabled={this.isEditMode()}>

                            <option value={CHOICES.TIMER}>Timer</option>
                            <option value={CHOICES.STOPWATCH}>Stopwatch</option>
                            <option value={CHOICES.REPEAT}>Repeat</option>
                        </select>
                        {this.renderModalSelectedOptionProperties()}
                        <button onClick={this.addOrEditTask.bind(this)}>OK</button>
                        <button onClick={this.closeModal.bind(this)}>Cancel</button>
                    </div>
                </Modal>
            </div>
        );
    }
}

export default App;
