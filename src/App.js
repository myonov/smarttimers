import React from 'react';
import './App.css'
import TasksComponent from './TasksComponent';
import DisplayComponent from './DisplayComponent';

const Components = {
    TASK_LIST: 1,
    RUNNING: 2,
};

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeComponent: Components.TASK_LIST,
            timersData: null,
        };
        this.changeActiveComponent = this.changeActiveComponent.bind(this);
    }

    changeActiveComponent(timersData) {
        this.setState({
            activeComponent: Components.RUNNING,
            timersData: timersData,
        });
    }

    render() {
        if (this.state.activeComponent === Components.TASK_LIST) {
            return <TasksComponent startCallback={this.changeActiveComponent}/>;
        }
        return <DisplayComponent timersData={this.state.timersData}/>
    }
}

export default App;
