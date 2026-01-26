import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@iot_devices';

interface Device {
  id: string;
  deviceName: string;
  roomName: string;
  command: string;
  color: string;
  createdAt: string;
}

interface DeviceStore {
  devices: Device[];
  loadDevices: () => Promise<void>;
  saveDevices: (devices: Device[]) => Promise<void>;
  addDevice: (device: Omit<Device, 'id' | 'createdAt'>) => Promise<void>;
  removeDevice: (id: string) => Promise<void>;
  updateDevice: (id: string, updatedData: Partial<Device>) => Promise<void>;
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  devices: [],
  
  loadDevices: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) {
        const devices = JSON.parse(jsonValue);
        set({ devices });
      }
    } catch (error) {
      console.error('Błąd ładowania urządzeń:', error);
    }
  },
  
  saveDevices: async (devices) => {
    try {
      const jsonValue = JSON.stringify(devices);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error('Błąd zapisywania urządzeń:', error);
    }
  },
  
  addDevice: async (device) => {
    const newDevice: Device = {
      id: Date.now().toString(),
      ...device,
      color: device.color || '#3b82f6',
      createdAt: new Date().toISOString(),
    };
    
    const updatedDevices = [...get().devices, newDevice];
    set({ devices: updatedDevices });
    await get().saveDevices(updatedDevices);
  },
  
  removeDevice: async (id) => {
    const updatedDevices = get().devices.filter(device => device.id !== id);
    set({ devices: updatedDevices });
    await get().saveDevices(updatedDevices);
  },
  
  updateDevice: async (id, updatedData) => {
    const updatedDevices = get().devices.map(device =>
      device.id === id ? { ...device, ...updatedData } : device
    );
    set({ devices: updatedDevices });
    await get().saveDevices(updatedDevices);
  },
}));