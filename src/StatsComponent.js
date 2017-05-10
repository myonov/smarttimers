import React from 'react';
import {formatTimeFromSeconds} from './utils';

export default function StatsComponent(props) {
    return <div className="finished-tasks">
        <h3>Finished</h3>
        <ol>
            {props.finishedTasks.map((item) => {
                return <li>
                    Task name: {item.task.title}<br />
                    Type: {item.task.type}<br />
                    Running time: {formatTimeFromSeconds(item.timeStats.runningTime)};
                    Paused time: {formatTimeFromSeconds(item.timeStats.pausedTime)}
                </li>
            })}
        </ol>
    </div>
}
