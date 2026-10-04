/**
 * Proxmark3 WebHID Service
 * Provides direct USB HID communication with Proxmark3 hardware.
 * Essential for systems where Web Serial (CDC ACM / COM ports) has permission
 * restrictions (e.g., non-root Linux without dialout group, sandboxed browsers, ChromeOS).
 */

export interface HidDeviceWrapper {
  device: any;
  connected: boolean;
  productName: string;
  vendorId: number;
  productId: number;
}

class ProxmarkHidService {
  private activeDevice: any = null;
  private onDataCallback: ((text: string) => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private inputReportListener: ((event: any) => void) | null = null;

  /**
   * Check if current browser supports WebHID API
   */
  public isWebHidSupported(): boolean {
    return typeof navigator !== 'undefined' && 'hid' in navigator;
  }

  /**
   * Request and open connection to a Proxmark3 device via WebHID
   */
  public async connectHardware(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isWebHidSupported()) {
      return {
        success: false,
        error: 'Tu navegador no soporta WebHID API. Utiliza Google Chrome, Microsoft Edge, Opera o navegadores Chromium actualizados.',
      };
    }

    try {
      // Known Proxmark3 / RFID Lab USB Vendor IDs and Product IDs
      const filters = [
        { vendorId: 0x9ac4 }, // Proxmark3 RDV4 (Official)
        { vendorId: 0x2d2d }, // Proxmark3 J-Type / Bootloader
        { vendorId: 0x1d50, productId: 0x6089 }, // OpenMoko Proxmark3
        { vendorId: 0x0483, productId: 0x5740 }, // STM32 Virtual COM / PM3 Easy
        { vendorId: 0x16c0, productId: 0x05df }, // USBasp / Alternative PM3 HID
      ];

      let devices: any[] = [];
      try {
        devices = await (navigator as any).hid.requestDevice({ filters });
      } catch (err: any) {
        if (err.name === 'NotFoundError') {
          return { success: false, error: 'Selección de dispositivo HID cancelada por el usuario.' };
        }
        // Fallback: request without vendor filters if restricted
        devices = await (navigator as any).hid.requestDevice({ filters: [] });
      }

      if (!devices || devices.length === 0) {
        return { success: false, error: 'No se seleccionó ningún dispositivo HID.' };
      }

      const device = devices[0];

      if (!device.opened) {
        await device.open();
      }

      this.activeDevice = device;

      // Attach input report listener to receive data from device
      this.inputReportListener = (event: any) => {
        const { data } = event;
        if (!data || data.byteLength === 0) return;

        // Decode DataView buffer to text
        const buffer = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        
        // Remove trailing null bytes commonly found in fixed-length HID reports
        let length = buffer.length;
        while (length > 0 && buffer[length - 1] === 0) {
          length--;
        }

        if (length > 0) {
          const textDecoder = new TextDecoder('utf-8', { fatal: false });
          const text = textDecoder.decode(buffer.subarray(0, length));
          if (text && this.onDataCallback) {
            this.onDataCallback(text);
          }
        }
      };

      device.addEventListener('inputreport', this.inputReportListener);

      // Listen for physical disconnection
      (navigator as any).hid.addEventListener('disconnect', (event: any) => {
        if (event.device === this.activeDevice) {
          this.disconnect();
        }
      });

      const vidHex = device.vendorId ? device.vendorId.toString(16).padStart(4, '0') : '????';
      const pidHex = device.productId ? device.productId.toString(16).padStart(4, '0') : '????';
      const deviceName = device.productName 
        ? `${device.productName} (HID ${vidHex}:${pidHex})` 
        : `Dispositivo Proxmark3 HID (${vidHex}:${pidHex})`;

      return {
        success: true,
        deviceName,
      };
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        return { success: false, error: 'Selección de dispositivo HID cancelada.' };
      }
      return { success: false, error: err.message || 'Error al conectar mediante WebHID.' };
    }
  }

  /**
   * Transmit command string to Proxmark3 through HID Output Reports
   */
  public async sendCommand(command: string): Promise<boolean> {
    if (!this.activeDevice || !this.activeDevice.opened) {
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const payload = encoder.encode(command.trim() + '\r\n');
      
      // Standard USB HID reports often use 64-byte fixed packets
      const REPORT_SIZE = 64;
      const reportId = 0x00; // Report ID 0 is default

      for (let offset = 0; offset < payload.length; offset += REPORT_SIZE) {
        const chunk = payload.subarray(offset, offset + REPORT_SIZE);
        const reportBuffer = new Uint8Array(REPORT_SIZE);
        reportBuffer.set(chunk);

        try {
          await this.activeDevice.sendReport(reportId, reportBuffer);
        } catch {
          // If report ID 0 fails, try sending without report ID or feature report
          await this.activeDevice.sendFeatureReport(reportId, reportBuffer);
        }
      }

      return true;
    } catch (err) {
      console.error('Failed to send command via WebHID:', err);
      return false;
    }
  }

  /**
   * Disconnect and release the HID device
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.activeDevice) {
        if (this.inputReportListener) {
          this.activeDevice.removeEventListener('inputreport', this.inputReportListener);
        }
        if (this.activeDevice.opened) {
          await this.activeDevice.close();
        }
      }
    } catch (e) {
      // Ignore disconnect errors
    } finally {
      this.activeDevice = null;
      this.inputReportListener = null;
      if (this.onDisconnectCallback) {
        this.onDisconnectCallback();
      }
    }
  }

  public setOnData(callback: (text: string) => void) {
    this.onDataCallback = callback;
  }

  public setOnDisconnect(callback: () => void) {
    this.onDisconnectCallback = callback;
  }

  public isConnected(): boolean {
    return this.activeDevice !== null && this.activeDevice.opened;
  }

  public getDevice(): any {
    return this.activeDevice;
  }
}

export const hidService = new ProxmarkHidService();
