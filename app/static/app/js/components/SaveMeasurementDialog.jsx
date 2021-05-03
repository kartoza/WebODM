import React from 'react';
import FormDialog from './FormDialog';
import PropTypes from 'prop-types';
import { _ } from '../classes/gettext';
import EditProjectDialog from "./EditProjectDialog";


class SaveMeasurementDialog extends React.Component {
    static defaultProps = {
        measurementName: "",
        title: _("New Measurement"),
        saveLabel: _("Save Measurement"),
        savingLabel: _("Saving measurement..."),
        saveIcon: "glyphicon glyphicon-plus",
        show: false
    };

    static propTypes = {
        measurementName: PropTypes.string,
        saveAction: PropTypes.func.isRequired,
        onShow: PropTypes.func,
        title: PropTypes.string,
        saveLabel: PropTypes.string,
        savingLabel: PropTypes.string,
        saveIcon: PropTypes.string,
        show: PropTypes.bool
    };

    constructor(props) {
        super(props);

        this.state = {
          name: props.measurementName,
        };

        this.reset = this.reset.bind(this);
        this.getFormData = this.getFormData.bind(this);
        this.onShow = this.onShow.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    reset() {
        this.setState({
            name: this.props.measurementName
          });
    }

    getFormData(){
      return this.state;
    }

    onShow(){
      this.nameInput.focus();
    }

    show(){
      this.dialog.show();
    }

    hide(){
      this.dialog.hide();
    }

    handleChange(field) {
        return (e) => {
            let state = {};
            state[field] = e.target.value;
            this.setState(state);
          }
    }

    render() {
        return (
            <FormDialog {...this.props} reset={this.reset}
                        getFormData={this.getFormData} onShow={this.onShow} ref={(domNode) => { this.dialog = domNode; }}>
                <div className="form-group">
                    <label
                        className="col-sm-2 control-label">{_("Name")}</label>
                    <div className="col-sm-10">
                        <input type="text" className="form-control"
                               ref={(domNode) => {
                                   this.nameInput = domNode;
                               }} value={this.state.name}
                               onChange={this.handleChange('name')}/>
                    </div>
                </div>
            </FormDialog>
        )
    }
}

export default SaveMeasurementDialog;