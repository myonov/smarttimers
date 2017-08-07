import React from 'react';
import WakeLock from 'react-wakelock';

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
        let component = null;
        if (this.state.activeComponent === APP_STATE.CREATE_TASKS) {
            component = <TasksComponent
                startCallback={this.changeActiveComponent}
                nextState={APP_STATE.EXECUTE_TASKS}/>;
        } else if (this.state.activeComponent === APP_STATE.EXECUTE_TASKS) {
            component = <DisplayComponent timersData={this.state.passedState}
                                          finishCallback={this.changeActiveComponent}
                                          nextState={APP_STATE.STATS}/>
        } else {
            component = <StatsComponent finishedTasks={this.state.passedState}
                                        finishCallback={this.changeActiveComponent}
                                        nextState={APP_STATE.CREATE_TASKS}/>
        }
        return <div>
            <WakeLock/>
            {component}
        </div>
    }
}

export default App;
