import React from "react";
import PropTypes from 'prop-types';


class RequestServicePanel extends React.Component {
    static propTypes = {
        workOrderTypeList: PropTypes.Array
    };

    static defaultProps = {
        workOrderTypeList: []
    };

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div style={{position: "absolute", zIndex: 9999, width: "300px"}}
                 className="measurementPanel">
                <p className={"panelTitle"}>REQUEST A SERVICE</p>
                <div id="accordion">
                    {this.props.workOrderTypeList.map((workOrder) => {
                        return <div key={workOrder.id} className="card">
                            <div className="card-header" id="headingOne">
                                <div className="panelMenu"
                                     data-bs-toggle="collapse"
                                     data-bs-target="#collapseOne"
                                     aria-expanded="true"
                                     aria-controls="collapseOne">
                                    <p>{workOrder.name}</p>
                                </div>
                            </div>
                        </div>
                    })}
                </div>
            </div>
        );
    }
}

export default RequestServicePanel;
