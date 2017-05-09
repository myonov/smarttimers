import React from 'react';
import './App.css'
import TasksComponent from './TasksComponent';
import DisplayComponent from './DisplayComponent';
import StatsComponent from './StatsComponent';

const APP_STATE = {
    CREATE_TASKS: 1,
    EXECUTE_TASKS: 2,
    STATS: 3,
};

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeComponent: APP_STATE.CREATE_TASKS,
            passedState: null,
        };
        this.changeActiveComponent = this.changeActiveComponent.bind(this);
    }

    changeActiveComponent(nextComponent, passedState) {
        this.setState({
            activeComponent: nextComponent,
            passedState: passedState,
        });
    }

    render() {
        if (this.state.activeComponent === APP_STATE.CREATE_TASKS) {
            return <TasksComponent
                startCallback={this.changeActiveComponent}
                nextState={APP_STATE.EXECUTE_TASKS}/>;
        }
        if (this.state.activeComponent === APP_STATE.EXECUTE_TASKS) {
            return <DisplayComponent timersData={this.state.passedState}
                                     finishCallback={this.changeActiveComponent}
                                     nextState={APP_STATE.STATS}/>
        }
        return <StatsComponent finishedTasks={this.state.passedState}/>
    }
}

export default App;
