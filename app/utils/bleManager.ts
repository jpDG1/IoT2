import { BleManager, Device } from 'react-native-ble-plx';

class BLEService {
  manager: BleManager;
  device: Device | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  // Сканування пристроїв
  scanDevices(onDeviceFound: (device: Device) => void) {
    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('Scan error:', error);
        return;
      }
      
      if (device && device.name) {
        onDeviceFound(device);
      }
    });
  }

  // Зупинити сканування
  stopScan() {
    this.manager.stopDeviceScan();
  }

  // Підключення до MLT-BT05
  async connectToDevice(deviceId: string) {
    try {
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      this.device = device;
      console.log('Connected to:', device.name);
      return device;
    } catch (error) {
      console.log('Connection error:', error);
      throw error;
    }
  }

  // Відправка команди (red, green, blue, off)
  async sendCommand(command: string) {
    if (!this.device) {
      throw new Error('No device connected');
    }

    const serviceUUID = 'FFE0';
    const characteristicUUID = 'FFE1';

    try {
      await this.manager.writeCharacteristicWithResponseForDevice(
        this.device.id,
        serviceUUID,
        characteristicUUID,
        btoa(command) // Кодуємо в Base64
      );
      console.log('Command sent:', command);
    } catch (error) {
      console.log('Send command error:', error);
      throw error;
    }
  }

  // Отримання даних з Arduino (кнопка)
  monitorDevice(onDataReceived: (data: string) => void) {
    if (!this.device) {
      throw new Error('No device connected');
    }

    const serviceUUID = 'FFE0';
    const characteristicUUID = 'FFE1';

    this.manager.monitorCharacteristicForDevice(
      this.device.id,
      serviceUUID,
      characteristicUUID,
      (error, characteristic) => {
        if (error) {
          console.log('Monitor error:', error);
          return;
        }

        if (characteristic?.value) {
          const data = atob(characteristic.value); // Декодуємо Base64
          onDataReceived(data);
        }
      }
    );
  }

  // Від'єднання
  async disconnect() {
    if (this.device) {
      await this.device.cancelConnection();
      this.device = null;
      console.log('Disconnected');
    }
  }
}

export default new BLEService();