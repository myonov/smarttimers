import React from 'react';
import FontAwesome from 'react-fontawesome';
import {formatTimeFromSeconds, renderFinishedTasks} from './utils';

import './StatsComponent.css';

export default function StatsComponent(props) {
    let totalTime = 0;
    let pausedTime = 0;
    let runningTime = 0;

    for (let finishedTask of props.finishedTasks) {
        pausedTime += finishedTask.timeStats.pausedTime;
        runningTime += finishedTask.timeStats.runningTime;
        totalTime += finishedTask.timeStats.pausedTime + finishedTask.timeStats.runningTime;
    }

    return <div className="container">
        <div className="finished-tasks-header">
            <h2>Finished</h2>
            <span>
                <FontAwesome name="angle-right"/>
                {formatTimeFromSeconds(totalTime)}
            </span>
            <span>
                <FontAwesome name="play"/>
                {formatTimeFromSeconds(runningTime)}
            </span>
            <span>
                <FontAwesome name="pause"/>
                {formatTimeFromSeconds(pausedTime)}
            </span>
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
