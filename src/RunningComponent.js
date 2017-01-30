import React from 'react';
import './RunningComponent.css'
import FontAwesome from 'react-fontawesome';

export default class RunningComponent extends  React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <div>
            Running!
        </div>
    }
}
