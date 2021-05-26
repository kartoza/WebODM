import React from 'react'
import '../css/FormDialog.scss';
import PropTypes from 'prop-types';
import { _ } from '../classes/gettext';


class MapPanel extends React.Component {
    static defaultProps = {
        title: _("Title"),
        show: true
    };

     static propTypes = {
        title: PropTypes.string,
    };

    constructor(props){
        super(props);
        this.state = {};
    }

    render() {
        return (
            <div style={{position: "absolute", zIndex: 998, width: "30em"}}
                 className="map-panel">
                <p className={"panelTitle"}>{this.props.title}</p>
                {this.props.children}
            </div>
        );
    }
}

export default MapPanel;
