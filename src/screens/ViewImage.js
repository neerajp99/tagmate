import React, {Component} from 'react';
import {View, Image, Dimensions} from 'react-native';
import {BRAND_COLOR_ONE} from './style/AdourStyle';

const { width: WIDTH } = Dimensions.get('window')

class ViewImage extends Component{

  constructor(props) {
      super(props);
      this.state = { imgURL:this.props.navigation.state.params.imgURL };
    }

    componentDidMount(){
      console.log('props: ', this.state.imgURL)
    }

    render() {
      const imgURL = this.state.imgURL;
      return (
        <View style={{alignItems: 'center', flex:1, justifyContent: 'center'}}>

          <Image
          style={{width: WIDTH, height: WIDTH}}
          source={{uri: imgURL}}
        />
      </View>
      )
    }

}


export {ViewImage};
