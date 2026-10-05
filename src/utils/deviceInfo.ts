import { Platform } from 'react-native';
import * as Device from 'expo-device';

export interface DeviceInfo {
  phoneModel: string;
  osName: string;
}

export function getDeviceInfo(): DeviceInfo {
  try {
    let brand = Device.brand ? Device.brand.charAt(0).toUpperCase() + Device.brand.slice(1) : '';
    let model = Device.modelName || Device.deviceName || '';

    if (!model || model === 'Unknown') {
      if (Platform.OS === 'android') {
        const androidModel = (Platform.constants as any)?.Model || 'Android Device';
        const androidBrand =
          (Platform.constants as any)?.Brand || (Platform.constants as any)?.Manufacturer || '';
        model = androidBrand ? `${androidBrand} ${androidModel}`.trim() : androidModel;
      } else if (Platform.OS === 'ios') {
        model = 'Apple iPhone';
      } else {
        model =
          typeof navigator !== 'undefined' && navigator.userAgent
            ? navigator.userAgent.includes('Mobile')
              ? 'Mobile Browser'
              : 'Desktop Browser'
            : 'Web Client';
      }
    }

    let phoneModel = model;
    if (brand && !model.toLowerCase().includes(brand.toLowerCase()) && Platform.OS !== 'ios') {
      phoneModel = `${brand} ${model}`.trim();
    }

    const osName = `${Device.osName || Platform.OS} ${Device.osVersion || Platform.Version || ''}`.trim();

    return {
      phoneModel: phoneModel || 'Mobile Device',
      osName: osName || Platform.OS,
    };
  } catch {
    return {
      phoneModel:
        Platform.OS === 'android' ? 'Android Device' : Platform.OS === 'ios' ? 'iPhone' : 'Web Browser',
      osName: Platform.OS,
    };
  }
}
