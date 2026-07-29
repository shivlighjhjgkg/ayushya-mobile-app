import { Platform } from 'react-native';
import NativeAqiRouteMap from './AqiRouteMap.native';
import WebAqiRouteMap from './AqiRouteMap.web';

const AqiRouteMap = Platform.OS === 'web' ? WebAqiRouteMap : NativeAqiRouteMap;

export default AqiRouteMap;
