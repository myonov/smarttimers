import React from 'react';
import Modal from 'react-modal';
import './App.css'

const ID_LENGTH = 10;

function generateId(length) {
    let result = '';
    for (let i = 0; i < length; ++i) {
        result += parseInt(Math.random() * 10, 10);
    }
    return result;
}

function computeList(taskList, task) {
    return taskList.concat(task);
}

function computeRearrangedTakList(taskList, index1, index2) {
    let computed = taskList.slice();
    computed[index1] = taskList[index2];
    computed[index2] = taskList[index1];
    return computed;
}

const CHOICES = {
    TIMER: 'timer',
    STOPWATCH: 'stopwatch',
    REPEAT: 'repeat',
};

const DEFAULT_MODAL_SELECTED_OPTION = CHOICES.TIMER;

function Navigation(props) {
    let moveUp = null;
    if (props.canMoveUp) {
        moveUp = <a onClick={props.moveUp}>Up</a>;
    }
    let moveDown = null;
    if (props.canMoveDown) {
        moveDown = <a onClick={props.moveDown}>Down</a>;
    }
    return <div className="navigation">
        {moveUp}
        {moveDown}
    </div>
}

function TimerComponent(props) {
    let task = props.task;

    return <div className="component timer-component">
        <h3>{task.title}</h3>
        <h4>Duration: {task.timer}</h4>
        {props.navigation}
    </div>
}

function StopwatchComponent(props) {
    let task = props.task;

    return <div className="component stopwatch-component">
        <h3>{task.title}</h3>
        {props.navigation}
    </div>
}

function RepeatComponent(props) {
    let task = props.task;

    return <div className="component repeat-component">
        <h3>{task.title}</h3>
        <h4>Repeat: {task.repeat}</h4>
        {props.navigation}
    </div>
}

function TaskComponent(props) {
    let task = props.task;
    let navigation = <Navigation
        canMoveUp={props.canMoveUp}
        canMoveDown={props.canMoveDown}
        moveUp={props.moveUp}
        moveDown={props.moveDown}/>;

    if (task.type === CHOICES.TIMER) {
        return <TimerComponent {...props} navigation={navigation}/>
    }
    if (task.type === CHOICES.STOPWATCH) {
        return <StopwatchComponent {...props} navigation={navigation}/>
    }
    return <RepeatComponent {...props} navigation={navigation}/>
}

class App extends React.Component {
    constructor() {
        super();
        this.state = {
            taskList: [],
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

    addTask() {
        let taskObj = this.createTask();
        let modifiedTaskList = computeList(this.state.taskList, taskObj);

        this.setState({
            taskList: modifiedTaskList,
        });
        this.closeModal();
    }

    openModal() {
        this.setState({modalIsOpen: true});
    }

    closeModal() {
        this.setState({
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

    moveTaskUp(index) {
        let newTaskList = computeRearrangedTakList(this.state.taskList, index - 1, index);
        this.setState({taskList: newTaskList});
    }

    moveTaskDown(index) {
        let newTaskList = computeRearrangedTakList(this.state.taskList, index, index + 1);
        this.setState({taskList: newTaskList});
    }

    render() {
        return (
            <div>
                <h3>Task List</h3>
                <div className="container">
                    {this.state.taskList.map(
                        (task, index) => <TaskComponent
                            task={task}
                            key={task.id}
                            canMoveUp={index !== 0}
                            canMoveDown={index !== this.state.taskList.length - 1}
                            moveUp={this.moveTaskUp.bind(this, index)}
                            moveDown={this.moveTaskDown.bind(this, index)}/>)}
                </div>
                <div>
                    <a onClick={this.openModal.bind(this)}>Add task</a>
                </div>

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
                        <button onClick={this.addTask.bind(this)}>Add</button>
                        <button onClick={this.closeModal.bind(this)}>Cancel</button>
                    </div>
                </Modal>
            </div>
        );
    }
}

export default App;
