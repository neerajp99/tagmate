import React, {Component} from 'react';
import {
  Text,
} from 'react-native';

export default class Text extends Component {
  constructor(props) {
    super(props)
    // Put your default font styles here.
    this.style = [{fontFamily: 'Helvetica', fontSize: 10}];
    if( props.style ) {
      if( Array.isArray(props.style) ) {
        this.style = this.style.concat(props.style)
      } else {
        this.style.push(props.style)
      }
    }
  }

  render() { return (
    <Text {...this.props} style={this.style}>
      {this.props.children}
    </Text>
  )}
}
