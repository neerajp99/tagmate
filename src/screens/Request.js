import React, {Component} from 'react';
import {View, Text} from 'react-native';
import {Card, ListItem} from 'react-native-elements';

const list = [
  {
  title: 'Get something from Delhi',
  icon: 'av-timer'
  },
  {
  title: 'Bum a cig',
  icon: 'flight-takeoff'
}];

class RequestScreen extends Component{

  render(){
    return(
      <Card title='Request'>
        {
          list.map((item, i) => (
            <ListItem
              key={i}
              title={item.title}
              leftIcon={{ name: item.icon }}
            />
          ))
        }
      </Card>
    )
  }
}

export {RequestScreen};
