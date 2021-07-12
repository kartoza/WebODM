import React from "react";
import {_} from "../classes/gettext";
import {Button} from "react-bootstrap";
import Dropdown from "react-bootstrap/Dropdown";
import PropTypes from "prop-types";


export default class LayersMenuDropdown extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired
    }

    constructor(props) {
        super(props);
        this.state = {
            showResourceList: false
        };
        this.showUserLayerDropdown = this.showUserLayerDropdown.bind(this);
        this.hideUserLayerDropdown = this.hideUserLayerDropdown.bind(this);
    }

    hideUserLayerDropdown(e) {
        if (e && e.relatedTarget) {
            e.relatedTarget.click();
        }
        this.setState({showResourceList: false});
    }

    showUserLayerDropdown(e) {
        if (e) {
            this.setState({showResourceList: true})
            $('body').append($('#resource-dropdown').css({
                position: 'absolute',
                left: $('#resource-dropdown').offset().left,
                top: $('#resource-dropdown').offset().top
            }).detach());
        }
    }

    render() {
        return (<div className="title" style={{display: 'flex'}}>
            <div style={{ paddingTop: "0.5em" }}>{this.props.title}</div>
            <Button onClick={this.showUserLayerDropdown} onBlur={this.hideUserLayerDropdown} variant="">
              <i style={{ color: "white" }} className="fa fa-cogs fa-fw"></i>
            </Button>
            <Dropdown alignRight id="resource-dropdown"
                      show={this.state.showResourceList}>
              <Dropdown.Toggle variant="success" id="dropdown-basic" className="hidden-dropdown-btn"></Dropdown.Toggle>
              <Dropdown.Menu className="resource-dropdown-menu">
                <Dropdown.Item href="/useradmin/resource/document/" eventKey="option-1"><i className="fa fa-list fa-fw"></i> {_("User Documents")}</Dropdown.Item>
                <Dropdown.Item href="/admin_user/stratafy/resourcelayer/" eventKey="option-2"><i className="fa fa-list fa-fw"></i> {_("User Layers")}</Dropdown.Item>
                <Dropdown.Item href="/useradmin/resource/measurement/" eventKey="option-3"><i className="fa fa-list fa-fw"></i> {_("Measurement Layers")}</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
        </div>)
    }
}
