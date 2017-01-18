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

function exportUrl(arr) {
    let encoded = encodeArray(arr);
    return window.location.href + '?export=' + encoded;
}

function queryStringToObject(query) {
    let result = {};
    for (let keyValuePair of query.split('&')) {
        if (!keyValuePair) {
            continue;
        }
        let [key, value] = keyValuePair.split('=');
        result[key] = value;
    }
    return result;
}

const DEFAULT_MODAL_SELECTED_OPTION = CHOICES.TIMER;

function Navigation(props) {
    let moveUp = null;
    if (props.canMoveUp) {
        moveUp = <a onClick={() => props.moveTaskUp(props.taskNode, props.index)}>Up</a>;
    }
    let moveDown = null;
    if (props.canMoveDown) {
        moveDown = <a onClick={() => props.moveTaskDown(props.taskNode, props.index)}>Down</a>;
    }
    return <div className="navigation">
        {moveUp}
        {moveDown}
    </div>
}

function TaskList(props) {
    let containerClassName = props.containerClassName || '';
    let taskNode = props.taskNode;

    return (
        <div className={containerClassName}>
            <div className="task-list">
                {props.taskList.map(
                    (task, index) => <TaskComponent
                        index={index}
                        task={task}
                        taskNode={taskNode}
                        key={task.id}
                        canMoveUp={index > 0}
                        canMoveDown={index < props.taskList.length - 1}
                        moveTaskUp={props.moveTaskUp}
                        moveTaskDown={props.moveTaskDown}
                        removeTask={props.removeTask}
                        openModal={props.openModal}/>)}
            </div>
            <div>
                <a onClick={() => props.openModal(taskNode)}>Add task</a>
            </div>
        </div>
    );
}

function TimerComponent(props) {
    let task = props.task;

    return <div className="component timer-component">
        <h3>{task.title}</h3>
        <h4>Duration: {task.timer}</h4>
        {props.remove}
        {props.navigation}
    </div>
}

function StopwatchComponent(props) {
    let task = props.task;

    return <div className="component stopwatch-component">
        <h3>{task.title}</h3>
        {props.remove}
        {props.navigation}
    </div>
}

function RepeatComponent(props) {
    let task = props.task;

    return <div className="component repeat-component">
        <h3>{task.title}</h3>
        <h4>Repeat: {task.repeat}</h4>
        {props.remove}
        {props.navigation}

        <TaskList
            taskList={task.taskList}
            openModal={props.openModal}
            moveTaskUp={props.moveTaskUp}
            moveTaskDown={props.moveTaskDown}
            removeTask={props.removeTask}
            taskNode={task}/>
    </div>
}

function Remove(props) {
    return <a onClick={(e) => {
        e.preventDefault();
        props.removeTask(props.taskNode, props.index)}}>
        Remove
    </a>
}

function TaskComponent(props) {
    let task = props.task;
    let navigation = <Navigation
        canMoveUp={props.canMoveUp}
        canMoveDown={props.canMoveDown}
        moveTaskUp={props.moveTaskUp}
        moveTaskDown={props.moveTaskDown}
        index={props.index}
        taskNode={props.taskNode}/>;
    let remove = <Remove index={props.index}
                         taskNode={props.taskNode}
                         removeTask={props.removeTask}/>;

    if (task.type === CHOICES.TIMER) {
        return <TimerComponent {...props} navigation={navigation} remove={remove}/>
    }
    if (task.type === CHOICES.STOPWATCH) {
        return <StopwatchComponent {...props} navigation={navigation} remove={remove}/>
    }
    return <RepeatComponent {...props} navigation={navigation} remove={remove}/>
}

class App extends React.Component {
    constructor() {
        super();

        let queryParams = queryStringToObject(window.location.search.substr(1));

        let initialTaskList = [];
        if (queryParams['export']) {
            try {
                initialTaskList = decodeToArray(queryParams['export']);
            } catch (_) {
                initialTaskList = [];
            }
        }
        let initialExport = exportUrl(initialTaskList);

        this.state = {
            taskList: initialTaskList,
            exportUrl: initialExport,
            modalIsOpen: false,
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
        let exported = exportUrl(newTaskList);
        this.setState({
            taskList: newTaskList,
            exportUrl: exported,
        });
    }

    addTask() {
        let taskObj = this.createTask();
        let modifiedTaskList = deepCopy(this.state.taskList);
        insertIntoTaskList(modifiedTaskList, this.state.addPlaceNode, taskObj);
        this.changeTaskList(modifiedTaskList);
        this.closeModal();
    }

    openModal(taskNode) {
        this.setState({
            addPlaceNode: taskNode,
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
            modalIsOpen: false
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

    moveTaskUp(taskNode, index) {
        let modifiedTaskList = deepCopy(this.state.taskList);
        let listToChange = findTaskList(modifiedTaskList, taskNode);
        swapMove(listToChange, index - 1, index);
        this.changeTaskList(modifiedTaskList);
    }

    moveTaskDown(taskNode, index) {
        let modifiedTaskList = deepCopy(this.state.taskList);
        let listToChange = findTaskList(modifiedTaskList, taskNode);
        swapMove(listToChange, index, index + 1);
        this.changeTaskList(modifiedTaskList);
    }

    removeTask(taskNode, index) {
        let modifiedTaskList = deepCopy(this.state.taskList);
        let listToChange = findTaskList(modifiedTaskList, taskNode);
        listToChange.splice(index, 1);
        this.changeTaskList(modifiedTaskList);
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
                    taskNode={null}
                    removeTask={this.removeTask.bind(this)}/>

                <Modal
                    isOpen={this.state.modalIsOpen}
                    onAfterOpen={this.modalAfterOpen.bind(this)}
                    onRequestClose={this.closeModal.bind(this)}
                    contentLabel='Add task'>
                    <div>
                        <input
                            onChange={this.modalInputChange.bind(this, 'modalTaskName')}
                            ref={input => this.input = input}/>
                        <select
                            value={this.state.modalSelectedOption}
                            onChange={this.modalInputChange.bind(this, 'modalSelectedOption')}>

                            <option value={CHOICES.TIMER}>Timer</option>
                            <option value={CHOICES.STOPWATCH}>Stopwatch</option>
                            <option value={CHOICES.REPEAT}>Repeat</option>
                        </select>
                        {this.renderModalSelectedOptionProperties()}
                        <button onClick={this.addTask.bind(this, null)}>Add</button>
                        <button onClick={this.closeModal.bind(this)}>Cancel</button>
                    </div>
                </Modal>

                <div className="export">
                    <textarea value={this.state.exportUrl} cols="80" rows="6" readOnly="readOnly"/>
                </div>
            </div>
        );
    }
}

export default App;
