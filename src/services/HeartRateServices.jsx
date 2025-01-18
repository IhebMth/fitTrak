// src/services/heartRateService.js

export class HeartRateService {
    constructor() {
      this.device = null;
      this.server = null;
      this.service = null;
      this.characteristic = null;
    }
  
    async connect() {
      try {
        // Request Bluetooth device with heart rate service
        this.device = await navigator.bluetooth.requestDevice({
          filters: [
            { services: ['heart_rate'] },
            { namePrefix: 'Garmin' },
            { namePrefix: 'Polar' }
          ],
          optionalServices: ['battery_service']
        });
  
        this.server = await this.device.gatt.connect();
        this.service = await this.server.getPrimaryService('heart_rate');
        this.characteristic = await this.service.getCharacteristic('heart_rate_measurement');
        
        // Start battery notifications
        const batteryService = await this.device.gatt.getPrimaryService('battery_service');
        const batteryLevelCharacteristic = await batteryService.getCharacteristic('battery_level');
        await batteryLevelCharacteristic.startNotifications();
        batteryLevelCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
          const batteryLevel = event.target.value.getUint8(0);
          this.batteryCallback(batteryLevel);
        });
  
        return true;
      } catch (error) {
        console.error('Error connecting to heart rate monitor:', error);
        throw error;
      }
    }
  
    async startNotifications(callback) {
      if (!this.characteristic) {
        throw new Error('Device not connected');
      }
  
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        const heartRate = value.getUint8(1);
        callback(heartRate);
      });
    }
  
    async disconnect() {
      if (this.device && this.device.gatt.connected) {
        await this.device.gatt.disconnect();
      }
    }
  
    isConnected() {
      return this.device?.gatt.connected || false;
    }
  
    // Method to set the battery callback for monitoring
    setBatteryCallback(callback) {
      this.batteryCallback = callback;
    }
  }
  