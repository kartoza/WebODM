import React from 'react';
import PropTypes from 'prop-types';
import '../css/MeasurementTable.scss';


class MeasurementTable extends React.Component {
    static propTypes = {
        measurementData: PropTypes.array
    };

    constructor(props) {
        super(props);
    }

    render() {
        return (<div className={"measurementTableContainer"}>
            <table className="table table-striped table-dark measurementTable">
                <thead>
                <tr>
                    <th scope="col" style={{ width: "10%"}}>•</th>
                    <th scope="col">Name</th>
                    <th scope="col">Length (m&sup2;)</th>
                    <th scope="col">Area (m&sup2;)</th>
                    <th scope="col">Volume (m&sup2;)</th>
                </tr>
                </thead>
                <tbody>
                { this.props.measurementData.map((object, i) => (
                    <tr key={i}>
                        <td style={{ width: "10%"}}><div className={"measurementColor"} style={{ backgroundColor: object['color'] ? object['color'] : '#555555' }}>&nbsp;</div></td>
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
