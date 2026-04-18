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

export interface ThermalPrintOptions {
  baudRate?: number;
}

class ThermalPrinterManager {
  private printers: PrinterDevice[] = [];
  private selectedPrinter: PrinterDevice | null = null;

  async detectPrinters(): Promise<PrinterDevice[]> {
    try {
      this.printers = [];
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

  encodeThermalPayload(content: string): Uint8Array {
    const encoder = new TextEncoder();
    const body = encoder.encode(content);
    const init = new Uint8Array([0x1b, 0x40]);
    const feed = new Uint8Array([0x0a, 0x0a, 0x0a]);
    const out = new Uint8Array(init.length + body.length + feed.length);
    out.set(init, 0);
    out.set(body, init.length);
    out.set(feed, init.length + body.length);
    return out;
  }

  async printToUSB(printer: PrinterDevice, content: string): Promise<PrintResult> {
    try {
      const device = printer.device;
      if (!device) throw new Error('No device');

      const data = this.encodeThermalPayload(content);
      await device.transferOut(1, data);

      return { success: true, message: 'Printed successfully' };
    } catch (error) {
      const err = error as Error;
      console.error('USB printing error:', err);
      return { success: false, message: 'USB printing failed: ' + err.message };
    }
  }

  escapeHtmlForPrint(text: string): string {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Opens the system print dialog with plain receipt text.
   * Uses a short delay and onafterprint so the document is laid out before print
   * and the window is not closed while the preview is still blank (common Chrome issue).
   */
  async printToSystem(_printer: PrinterDevice | null, content: string): Promise<PrintResult> {
    try {
      const safeBody = this.escapeHtmlForPrint(content);
      const html = `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Print Order</title>
            <style>
              html, body {
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px;
                line-height: 1.25;
                margin: 0;
                padding: 12px;
                color: #000;
                background: #fff;
                white-space: pre-wrap;
              }
              @media print {
                html, body { margin: 0; padding: 8px; }
              }
            </style>
          </head>
          <body>${safeBody}</body>
        </html>`;

      const runPrint = (win: Window) => {
        let done = false;
        const safeClose = () => {
          if (done) return;
          done = true;
          try {
            win.close();
          } catch {
            /* ignore */
          }
        };
        win.focus();
        win.addEventListener(
          'afterprint',
          () => {
            safeClose();
          },
          { once: true }
        );
        window.setTimeout(() => {
          win.print();
          window.setTimeout(() => {
            if (!done && !win.closed) safeClose();
          }, 120000);
        }, 300);
      };

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        runPrint(printWindow);
        return { success: true, message: 'Print dialog opened' };
      }

      const iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.title = 'Print receipt';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) {
        document.body.removeChild(iframe);
        throw new Error('Could not create print frame');
      }

      doc.open();
      doc.write(html);
      doc.close();

      const removeFrame = () => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      };

      let frameRemoved = false;
      const safeRemoveFrame = () => {
        if (frameRemoved) return;
        frameRemoved = true;
        removeFrame();
      };
      win.addEventListener('afterprint', () => safeRemoveFrame(), { once: true });
      win.focus();
      window.setTimeout(() => {
        win.print();
        window.setTimeout(() => {
          if (!frameRemoved) safeRemoveFrame();
        }, 120000);
      }, 300);

      return { success: true, message: 'Print dialog opened' };
    } catch (error) {
      const err = error as Error;
      console.error('System printing error:', err);
      return { success: false, message: 'System printing failed: ' + err.message };
    }
  }

  async printToSerial(
    _printer: PrinterDevice | null,
    content: string,
    baudRate: number = 9600
  ): Promise<PrintResult> {
    try {
      if (!navigator.serial) throw new Error('Serial API not available');
      const port = await navigator.serial.requestPort();
      const rate = Number.isFinite(baudRate) && baudRate > 0 ? baudRate : 9600;
      await port.open({ baudRate: rate });

      const data = this.encodeThermalPayload(content);
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

  async print(
    content: string,
    printerType: 'usb' | 'serial' | 'system' = 'system',
    options?: ThermalPrintOptions
  ): Promise<PrintResult> {
    try {
      const baud = options?.baudRate;
      switch (printerType) {
        case 'usb':
          if (this.selectedPrinter?.device) {
            return await this.printToUSB(this.selectedPrinter, content);
          }
          break;
        case 'serial':
          return await this.printToSerial(null, content, baud);
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
