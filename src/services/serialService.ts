/**
 * Service to interface with Proxmark3 either via Chrome/Edge Web Serial API
 * or via realistic Virtual Device Simulation.
 */

export interface SerialPortWrapper {
  port: any;
  reader: any;
  writer: any;
  connected: boolean;
}

class ProxmarkSerialService {
  private activePort: any = null;
  private reader: any = null;
  private writer: any = null;
  private isReading = false;
  private onDataCallback: ((text: string) => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  public isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public async connectHardware(baudRate: number = 115200): Promise<{ success: boolean; portName?: string; error?: string }> {
    if (!this.isWebSerialSupported()) {
      return {
        success: false,
        error: 'Tu navegador no soporta Web Serial API. Usa Google Chrome, Microsoft Edge, Opera o Chromium.',
      };
    }

    try {
      // Proxmark3 typical VID/PID filters (RDV4 is 9ac4:4b8f or generic FTDI/CDC ACM)
      const port = await (navigator as any).serial.requestPort({
        // Leave filters empty to allow user to pick any COM port / ACM device
      });

      await port.open({ baudRate });
      this.activePort = port;

      // Start background reading loop
      this.startReading();

      // Listen for disconnect event
      port.addEventListener?.('disconnect', () => {
        this.disconnect();
      });

      const info = port.getInfo?.() || {};
      const portName = info.usbVendorId ? `USB (${info.usbVendorId.toString(16)}:${info.usbProductId?.toString(16)})` : 'Puerto Serial USB';

      return {
        success: true,
        portName,
      };
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        return { success: false, error: 'Selección de puerto cancelada por el usuario.' };
      }
      return { success: false, error: err.message || 'Error al abrir el puerto serie.' };
    }
  }

  private async startReading() {
    if (!this.activePort || !this.activePort.readable) return;
    this.isReading = true;

    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.activePort.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (this.isReading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value && this.onDataCallback) {
          this.onDataCallback(value);
        }
      }
    } catch (error) {
      console.warn('Serial read error or disconnected:', error);
    } finally {
      this.reader?.releaseLock?.();
    }
  }

  public async sendCommand(command: string): Promise<boolean> {
    if (!this.activePort || !this.activePort.writable) {
      return false;
    }

    try {
      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(this.activePort.writable);
      const writer = textEncoder.writable.getWriter();
      await writer.write(command.trim() + '\r\n');
      writer.releaseLock();
      return true;
    } catch (err) {
      console.error('Failed to send command to Proxmark3:', err);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.isReading = false;
    try {
      await this.reader?.cancel?.();
      await this.activePort?.close?.();
    } catch (e) {
      // Ignore cleanup error
    } finally {
      this.activePort = null;
      this.reader = null;
      this.writer = null;
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
    return this.activePort !== null;
  }
}

export const serialService = new ProxmarkSerialService();
