import React, {Component} from 'react';
import {Card, ListItem, Button} from 'react-native-elements';
import {View, ActivityIndicator, StyleSheet, Text, TextInput} from 'react-native';
import {postServiceRequest} from "../lib/firebaseUtils";

class RequestDetails extends Component{
  	state = {when:'', details:''};

  	sendRequest = () =>
    {
        const {when, details} = this.state;
        if(when.length == 0) return alert('Please input when.');
        if(when.length > 20) return alert('When should not exceed 20 characters.');
        if(details.length > 60) return alert('Details should not exceed 60 characters.');
        postServiceRequest({serviceId:this.props.navigation.state.params.item.id,when:when,details:details}).then(res => {
        	this.props.navigation.navigate('RequestScreen');
        })
    }

  render(){
  	const { title } = this.props.navigation.state.params.item;
    return(
      	<View style={styles.backgroundContainer}>
	        <Card title='Request Service'>
	            <Text style={styles.requestTitle}>{title}</Text>
	            <Text>When?</Text>
	            <TextInput
	            placeholder="Required"
	            style={styles.textInput}
	            onChangeText={when => this.setState({ when: when })} />
	            <Text>Details?</Text>
	            <TextInput
	            placeholder="Optional"
	            style={styles.textInput}
	            onChangeText={details => this.setState({ details: details })} />
	            <Button title="Request" onPress={() => {this.sendRequest()}}/>
	        </Card>
	    </View>
    )
  }
}
/*
<View>
    <Text>Provide additional details</Text>
</View>
*/
export {RequestDetails};

const styles = StyleSheet.create({
		backgroundContainer: {
		flex: 1,
		paddingLeft: 15,
		paddingRight: 8
	},
    mainContainer: {
        flex: 1,
    },
    progressContainer: {
        left: '50%',
        top: '50%',
        width: 100,
        height: 100,
        backgroundColor: 'transparent',
        marginLeft: -50,
        marginTop: -50

    },
    requestTitle: {
        fontWeight: 'bold',
    },
    textInput: {
        height: 40,
        width: '90%',
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 8,
    },
})