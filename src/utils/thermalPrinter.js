// Thermal Printer Utility
class ThermalPrinterManager {
  constructor() {
    this.printers = [];
    this.selectedPrinter = null;
  }

  // Detect available printers
  async detectPrinters() {
    try {
      // Check if Web USB API is available
      if (!navigator.usb) {
        console.warn('Web USB API not available');
        return [];
      }

      // Request USB device access
      const device = await navigator.usb.requestDevice({
        filters: [
          // Common thermal printer vendor IDs
          { vendorId: 0x0483 }, // STMicroelectronics
          { vendorId: 0x04b8 }, // Epson
          { vendorId: 0x0416 }, // WinChipHead
          { vendorId: 0x03f0 }, // HP
          { vendorId: 0x0483 }, // STMicroelectronics (common for thermal printers)
          { vendorId: 0x1a86 }, // QinHeng Electronics
          { vendorId: 0x10c4 }, // Silicon Labs
          { vendorId: 0x067b }, // Prolific Technology
        ]
      });

      if (device) {
        await device.open();
        await device.selectConfiguration(1);
        await device.claimInterface(0);
        
        this.printers.push({
          id: device.productId,
          name: device.productName || `Thermal Printer (${device.productId})`,
          device: device,
          connected: true
        });
      }

      return this.printers;
    } catch (error) {
      console.log('No USB printers detected or access denied:', error);
      return [];
    }
  }

  // Get system printers (fallback method)
  async getSystemPrinters() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const printers = devices.filter(device => 
          device.kind === 'printer' || 
          device.label.toLowerCase().includes('printer') ||
          device.label.toLowerCase().includes('thermal')
        );
        
        return printers.map(printer => ({
          id: printer.deviceId,
          name: printer.label || 'Unknown Printer',
          type: 'system',
          connected: true
        }));
      }
    } catch (error) {
      console.log('Could not enumerate system printers:', error);
    }
    
    return [];
  }

  // Print using Web USB (for USB thermal printers)
  async printToUSB(printer, content) {
    try {
      const device = printer.device;
      
      // Convert text content to bytes
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      
      // Send data to printer
      await device.transferOut(1, data);
      
      return { success: true, message: 'Printed successfully' };
    } catch (error) {
      console.error('USB printing error:', error);
      return { success: false, message: 'USB printing failed: ' + error.message };
    }
  }

  // Print using system print dialog
  async printToSystem(printer, content) {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
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
      
      // Wait for content to load
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      
      return { success: true, message: 'Print dialog opened' };
    } catch (error) {
      console.error('System printing error:', error);
      return { success: false, message: 'System printing failed: ' + error.message };
    }
  }

  // Print using Web Serial API (for serial thermal printers)
  async printToSerial(printer, content) {
    try {
      // Request serial port access
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
      console.error('Serial printing error:', error);
      return { success: false, message: 'Serial printing failed: ' + error.message };
    }
  }

  // Main print function
  async print(content, printerType = 'system') {
    try {
      switch (printerType) {
        case 'usb':
          if (this.selectedPrinter && this.selectedPrinter.device) {
            return await this.printToUSB(this.selectedPrinter, content);
          }
          break;
        case 'serial':
          return await this.printToSerial(null, content);
        case 'system':
        default:
          return await this.printToSystem(null, content);
      }
    } catch (error) {
      console.error('Printing error:', error);
      return { success: false, message: 'Printing failed: ' + error.message };
    }
  }

  // Set selected printer
  setSelectedPrinter(printer) {
    this.selectedPrinter = printer;
  }

  // Get selected printer
  getSelectedPrinter() {
    return this.selectedPrinter;
  }

  // Check if thermal printer features are available
  isThermalPrinterSupported() {
    return !!(navigator.usb || navigator.serial || window.print);
  }
}

// Create singleton instance
const thermalPrinterManager = new ThermalPrinterManager();

export default thermalPrinterManager; 