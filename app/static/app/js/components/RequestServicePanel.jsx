import React from "react";


class RequestServicePanel extends React.Component {
    render() {
        return (
            <div style={{position: "absolute", zIndex: 9999, width: "300px"}}
                 className="measurementPanel">
                <p className={"panelTitle"}>REQUEST A SERVICE</p>
                <div id="accordion">
                    <div className="card">
                        <div className="card-header" id="headingOne">
                            <div className="panelMenu"
                                 data-bs-toggle="collapse"
                                 data-bs-target="#collapseOne"
                                 aria-expanded="true"
                                 aria-controls="collapseOne">
                                <p>Service 1</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default RequestServicePanel;
