import React, { PureComponent } from 'react';
import { View, Text, NetInfo, Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

function MiniOfflineSign() {
  return (
    <View style={styles.container}>
      <Text style={styles.offlineText}>No Internet Connection</Text>
    </View>
  );
}

class OfflineNotice extends PureComponent {
  state = {
    isConnected: true
  };

  componentDidMount() {
    this._isMounted = true;
    this.poll()
    //NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
  }

  componentWillUnmount() {
    this._isMounted = false;
    //NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  poll = () => {
  setTimeout(() => {
    this.poll();

    return fetch('https://www.google.com')
      .then((response) => {
        if(this._isMounted) this.setState({ isConnected: true });
      })
      .catch((err) => {
        if(this._isMounted) this.setState({ isConnected: false });
      });
  }, 3000);
}

  handleConnectivityChange = isConnected => {
    if (isConnected) {
      this.setState({ isConnected });
    } else {
      this.setState({ isConnected });
    }
  };

  render() {
    if (!this.state.isConnected) {
      return <MiniOfflineSign />;
    }
    return null;
  }
}

const styles = StyleSheet.create({
  offlineContainer: {
    backgroundColor: '#b52424',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width,
    position: 'absolute',
    top: 30
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#393939',
    flexDirection: 'row',
    height: 42,
    justifyContent: 'center',
    width: '100%'
  },
  offlineText: { color: '#fff' }
});

export default OfflineNotice;
