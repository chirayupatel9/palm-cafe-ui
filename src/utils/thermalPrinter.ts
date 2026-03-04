interface PrinterDevice {
  id: string | number;
  name: string;
  device?: any;
  type?: string;
  connected: boolean;
}

interface PrintResult {
  success: boolean;
  message: string;
}

declare global {
  interface Navigator {
    usb?: {
      requestDevice: (options: { filters: Array<{ vendorId: number }> }) => Promise<any>;
    };
    serial?: {
      requestPort: () => Promise<SerialPort>;
    };
  }
}

interface SerialPort {
  open: (options: { baudRate: number }) => Promise<void>;
  writable: WritableStream<Uint8Array>;
  close: () => Promise<void>;
}

class ThermalPrinterManager {
  private printers: PrinterDevice[] = [];
  private selectedPrinter: PrinterDevice | null = null;

  async detectPrinters(): Promise<PrinterDevice[]> {
    try {
      if (!navigator.usb) {
        console.warn('Web USB API not available');
        return [];
      }

      const device = await navigator.usb.requestDevice({
        filters: [
          { vendorId: 0x0483 },
          { vendorId: 0x04b8 },
          { vendorId: 0x0416 },
          { vendorId: 0x03f0 },
          { vendorId: 0x1a86 },
          { vendorId: 0x10c4 },
          { vendorId: 0x067b }
        ]
      });

      if (device) {
        await device.open();
        await device.selectConfiguration(1);
        await device.claimInterface(0);

        this.printers.push({
          id: device.productId,
          name: device.productName || `Thermal Printer (${device.productId})`,
          device,
          connected: true
        });
      }

      return this.printers;
    } catch {
      return [];
    }
  }

  async getSystemPrinters(): Promise<PrinterDevice[]> {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const printers = devices.filter(
          (device) =>
            (device.kind as string) === 'printer' ||
            device.label?.toLowerCase().includes('printer') ||
            device.label?.toLowerCase().includes('thermal')
        );

        return printers.map((printer) => ({
          id: printer.deviceId,
          name: printer.label || 'Unknown Printer',
          type: 'system',
          connected: true
        }));
      }
    } catch {
      // Could not enumerate system printers
    }

    return [];
  }

  async printToUSB(printer: PrinterDevice, content: string): Promise<PrintResult> {
    try {
      const device = printer.device;
      if (!device) throw new Error('No device');

      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      await device.transferOut(1, data);

      return { success: true, message: 'Printed successfully' };
    } catch (error) {
      const err = error as Error;
      console.error('USB printing error:', err);
      return { success: false, message: 'USB printing failed: ' + err.message };
    }
  }

  async printToSystem(_printer: PrinterDevice | null, content: string): Promise<PrintResult> {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('Could not open print window');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Order</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                margin: 0;
                padding: 10px;
                white-space: pre-wrap;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      return { success: true, message: 'Print dialog opened' };
    } catch (error) {
      const err = error as Error;
      console.error('System printing error:', err);
      return { success: false, message: 'System printing failed: ' + err.message };
    }
  }

  async printToSerial(_printer: PrinterDevice | null, content: string): Promise<PrintResult> {
    try {
      if (!navigator.serial) throw new Error('Serial API not available');
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });

      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const writer = port.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();
      await port.close();

      return { success: true, message: 'Printed via serial port' };
    } catch (error) {
      const err = error as Error;
      console.error('Serial printing error:', err);
      return { success: false, message: 'Serial printing failed: ' + err.message };
    }
  }

  async print(content: string, printerType: 'usb' | 'serial' | 'system' = 'system'): Promise<PrintResult> {
    try {
      switch (printerType) {
        case 'usb':
          if (this.selectedPrinter?.device) {
            return await this.printToUSB(this.selectedPrinter, content);
          }
          break;
        case 'serial':
          return await this.printToSerial(null, content);
        case 'system':
        default:
          return await this.printToSystem(null, content);
      }
      return { success: false, message: 'No printer selected' };
    } catch (error) {
      const err = error as Error;
      console.error('Printing error:', err);
      return { success: false, message: 'Printing failed: ' + err.message };
    }
  }

  setSelectedPrinter(printer: PrinterDevice | null): void {
    this.selectedPrinter = printer;
  }

  getSelectedPrinter(): PrinterDevice | null {
    return this.selectedPrinter;
  }

  isThermalPrinterSupported(): boolean {
    return !!(navigator.usb || navigator.serial || typeof window !== 'undefined' && window.print);
  }
}

const thermalPrinterManager = new ThermalPrinterManager();

export default thermalPrinterManager;
