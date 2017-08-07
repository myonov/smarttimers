import React from 'react';
import {renderFinishedTasks} from './utils';

import './StatsComponent.css';

export default function StatsComponent(props) {
    return <div className="container">
        <div className="finished-tasks-header">
            <h2>Finished</h2>
            <h4>
                <a className="underlined"
                   onClick={() => {
                       props.finishCallback(props.nextState)
                   }}>Back to tasks</a>
            </h4>
        </div>
        {renderFinishedTasks(props.finishedTasks)}
    </div>
}
