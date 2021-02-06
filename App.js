/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState, useRef} from 'react';
import {
    StyleSheet,
    StatusBar,
    Alert,
} from 'react-native';
import styled from 'styled-components';
import MapView, {Marker} from 'react-native-maps';

import {
    Header,
    LearnMoreLinks,
    Colors,
    DebugInstructions,
    ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import Geolocation from '@react-native-community/geolocation';
import storage from './storage';
import Prompt from 'react-native-input-prompt';


const AppView = styled.SafeAreaView`
    flex: 1;
`;

const MainView = styled.View`
    position: absolute;
    background: grey;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
`;

const CtaView = styled.View`
    position: absolute;
    height: 120px;
    bottom: 0;
    left: 0;
    right: 0;    
`;

const SaveButton = styled.TouchableHighlight`
    border-radius: 100px;
    background: orange;
    width: 95px;
    height: 95px;
    box-shadow: 0 0 35px rgba(0,0,0,0.4);
  
    margin: 0 auto;
`;

const SaveButtonText = styled.Text`
    position: absolute;
    top: 30px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 30px;
`;

const CustomMarkerView = styled.TouchableHighlight`
    border-radius: 100px;
    background: orange;
    box-shadow: 0 0 4px rgba(0,0,0,0.05);
    width: 50px;
    height: 50px;
`;

const CustomMarkerViewText = styled.TouchableHighlight`
    position: absolute;
    right: -25px;
    background: white;
    width: 100px;
    text-align: center;
    box-shadow: 0 0 4px rgba(0,0,0,0.15);
    top: -65px;
    padding: 10px;
`;

const CustomMarkerViewTextInner = styled.Text`
    text-align: center;
`;


const App: () => React$Node = () => {

    const [currentLocation, setCurrentLocation] = useState({latitude: 0, longitude: 0});
    const [allLocations, setAllLocations] = useState([]);
    const [promptVisible, setPromptVisible] = useState(false);

    const mapRef = useRef(null);

    useEffect(() => {

        storage.load({key: 'userLocation'}).then((locationData) => {
            setAllLocations(locationData);
        });

        Geolocation.getCurrentPosition((position) => {
            console.log('RUN ON INIT SUCCESS', position);
            setCurrentLocation({latitude: position.coords.latitude, longitude: position.coords.longitude});
        }, (err) => {
            console.log('RUN ON INIT ERROR', err);
        });

        Geolocation.watchPosition((position) => {
            setCurrentLocation({latitude: position.coords.latitude, longitude: position.coords.longitude});
            const camera = {
                center: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                },
                heading: 90,
                pitch: 0,
            };
            console.log('ANIMATE TO', camera);
            if (mapRef) {
                mapRef.current.animateCamera(camera);
            }
        });

    }, []);

    const saveLocation = async (title) => {
        console.log('SAVE LOCATION TRIGGERED');
        // get the current data
        let currentData;
        try {
            console.log('SAVE LOCATION TRIGGERED 1');
            currentData = await storage.load({key: 'userLocation'});
            console.log('SAVE LOCATION TRIGGERED 1', currentData);
            currentData.push({title, latitude: currentLocation.latitude, longitude: currentLocation.longitude});

            await storage.save({key: 'userLocation', data: currentData});
            setAllLocations(currentData);

        } catch (err) {
            console.log('ERR IS', err);
            currentData = [];
            currentData.push({title, latitude: currentLocation.latitude, longitude: currentLocation.longitude});
            await storage.save({key: 'userLocation', data: currentData});
            setAllLocations(currentData);
        }

        setPromptVisible(false);
    };

    const confirmDelete = (d) => {
        Alert.alert(
            'Max POI App',
            'Delete this POI?',
            [
                {text: 'No', onPress: () => null},
                {text: 'Yes', onPress: () => deleteMarker(d)},
            ],
            {cancelable: true},
        );
    };

    const deleteMarker = async (d) => {
        console.log('DELETE MARKER', d);

        const updatedLocations = allLocations.filter((v) => d !== v);
        console.log('DELETE MARKER 1', updatedLocations);
        await storage.save({key: 'userLocation', data: updatedLocations});
        setAllLocations(updatedLocations);
    };

    return (
        <>
            <StatusBar barStyle="dark-content"/>
            <AppView>
                {
                    (currentLocation.latitude !== 0 && currentLocation.longitude !== 0) && (
                        <MainView>
                            <MapView
                                ref={mapRef}
                                style={mapStyle.container}
                                zoomEnabled={true}
                                showsUserLocation={false}
                                initialRegion={{
                                    latitude: currentLocation.latitude,
                                    longitude: currentLocation.longitude,
                                    latitudeDelta: 0.001,
                                    longitudeDelta: 0.001,
                                }}
                            >
                                {
                                    allLocations.map((m, i) => (
                                        <Marker key={i} coordinate={{latitude: m.latitude, longitude: m.longitude}}>
                                            <CustomMarkerView onPress={() => confirmDelete(m)}>
                                                <CustomMarkerViewText>
                                                    <CustomMarkerViewTextInner>{m.title}</CustomMarkerViewTextInner>
                                                </CustomMarkerViewText>
                                            </CustomMarkerView>
                                        </Marker>
                                    ))
                                }
                            </MapView>
                            {
                                !promptVisible && (
                                    <CtaView>
                                        <SaveButton onPress={() => setPromptVisible(true)}>
                                            <SaveButtonText>PIN</SaveButtonText>
                                        </SaveButton>
                                    </CtaView>
                                )
                            }
                            <Prompt
                                title="Remember this POI as:"
                                placeholder="Remember this POI as..."
                                visible={promptVisible}
                                onCancel={() => setPromptVisible(false)}
                                onSubmit={(title) => saveLocation(title)}/>
                        </MainView>
                    )
                }
            </AppView>
        </>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        backgroundColor: Colors.lighter,
    },
    engine: {
        position: 'absolute',
        right: 0,
    },
    body: {
        backgroundColor: Colors.white,
    },
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.black,
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
        color: Colors.dark,
    },
    highlight: {
        fontWeight: '700',
    },
    footer: {
        color: Colors.dark,
        fontSize: 12,
        fontWeight: '600',
        padding: 4,
        paddingRight: 12,
        textAlign: 'right',
    },
});

const mapStyle = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default App;
