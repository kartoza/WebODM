import React from 'react';
import PropTypes from 'prop-types';
import update from "immutability-helper";


class MeasurementTable extends React.Component {
    static propTypes = {
        measurementData: PropTypes.array
    };

    constructor(props) {
        super(props);
    }

    render() {
        return (<div style={{
            position: "absolute",
            zIndex: 999,
            backgroundColor: "#ffffff",
            height: "300px",
            right: 0,
            bottom: 0,
            marginRight: 70,
            marginBottom: 70
        }}>
            <table className="table">
                <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Length (m&sup2;)</th>
                    <th scope="col">Area (m&sup2;)</th>
                    <th scope="col">Volume (m&sup2;)</th>
                </tr>
                </thead>
                <tbody>
                { this.props.measurementData.map((object, i) => (
                    <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{ object['name'] ? object['name'] : '-' }</td>
                        <td>{ object['Length'] ? parseFloat(object['Length']).toFixed(2) : '-' }</td>
                        <td>{ object['Area'] ? parseFloat(object['Area']).toFixed(2) : '-'}</td>
                        <td>{ object['Volume'] ? parseFloat(object['Volume']).toFixed(2) : '-'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>)

    }
}

export default MeasurementTable;
