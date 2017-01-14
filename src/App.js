import React from 'react';
import Modal from 'react-modal';

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

const CHOICES = {
    TIMER: 'timer',
    STOPWATCH: 'stopwatch',
    REPEAT: 'repeat',
};

const DEFAULT_MODAL_SELECTED_OPTION = CHOICES.TIMER;

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

    renderModalSelectedOptionProperties() {
        if (this.state.modalSelectedOption === CHOICES.STOPWATCH) {
            return null;
        }
        if (this.state.modalSelectedOption === CHOICES.TIMER) {
            return <input
                onChange={this.modalInputChange.bind(this, 'modalTimerInput')}
                value={this.state.modalTimerInput}
            />
        }
        return <input
            onChange={this.modalInputChange.bind(this, 'modalRepeatInput')}
            value={this.state.modalRepeatInput}
        />
    }

    render() {
        return (
            <div>
                <h3>Task List</h3>
                <div className="container">
                    {this.state.taskList.map(task => <div key={task.id}>{task.title}</div>)}
                </div>
                <div>
                    <a onClick={this.openModal.bind(this)}>Add task</a>
                </div>

                <Modal
                    isOpen={this.state.modalIsOpen}
                    onRequestClose={this.closeModal.bind(this)}
                    contentLabel='Add task'
                >
                    <div>
                        <input onChange={this.modalInputChange.bind(this, 'modalTaskName')} />
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
