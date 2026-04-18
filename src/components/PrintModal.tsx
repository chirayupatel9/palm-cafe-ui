import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Printer, Usb, Wifi, Settings, CheckCircle, RefreshCw } from 'lucide-react';
import Dialog from './ui/Dialog';
import thermalPrinterManager from '../utils/thermalPrinter';
import toast from 'react-hot-toast';
import { useCafeSettings } from '../contexts/CafeSettingsContext';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onPrintSuccess?: () => void;
}

const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, order, onPrintSuccess }) => {
  const { cafeSettings } = useCafeSettings();
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<any>(null);
  const [printerType, setPrinterType] = useState('system');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [printPreview, setPrintPreview] = useState('');

  const orderId =
    order?.id != null ? order.id : order?.order_id != null ? order.order_id : null;

  useEffect(() => {
    if (!isOpen) return;
    const t = cafeSettings.default_printer_type;
    if (t === 'usb' || t === 'serial' || t === 'system') {
      setPrinterType(t);
    }
  }, [isOpen, cafeSettings.default_printer_type]);

  useEffect(() => {
    if (isOpen) {
      detectPrinters();
      generatePrintPreview();
    }
  }, [isOpen, order]);

  const detectPrinters = async () => {
    setIsDetecting(true);
    try {
      // Detect USB printers
      const usbPrinters = await thermalPrinterManager.detectPrinters();
      
      // Get system printers
      const systemPrinters = await thermalPrinterManager.getSystemPrinters();
      
      const allPrinters = [
        ...usbPrinters.map(p => ({ ...p, type: 'usb' })),
        ...systemPrinters.map(p => ({ ...p, type: 'system' }))
      ];
      
      setPrinters(allPrinters);
      
      // Auto-select first printer if available
      if (allPrinters.length > 0 && !selectedPrinter) {
        setSelectedPrinter(allPrinters[0]);
        setPrinterType(allPrinters[0].type);
      }
    } catch (error) {
      console.error('Error detecting printers:', error);
      toast.error('Failed to detect printers');
    } finally {
      setIsDetecting(false);
    }
  };

  const generatePrintPreview = async () => {
    if (orderId == null || orderId === '') {
      setPrintPreview('');
      return;
    }

    setPreviewLoading(true);
    setPrintPreview('');
    try {
      const response = await axios.post(
        `/orders/${orderId}/print`,
        {},
        { responseType: 'text', transformResponse: [(data) => data] }
      );
      const text =
        typeof response.data === 'string' ? response.data : String(response.data ?? '');
      setPrintPreview(text);
      if (!text.trim()) {
        toast.error('Receipt is empty. Check the order and try again.');
      }
    } catch (error) {
      console.error('Error generating print preview:', error);
      const ax = error as { response?: { data?: unknown }; message?: string };
      const detail =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : (ax.response?.data as { error?: string })?.error;
      toast.error(detail || ax.message || 'Failed to load print preview');
      setPrintPreview('');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!order) return;

    if (!printPreview.trim()) {
      toast.error('Nothing to print. Wait for the preview to load or refresh.');
      return;
    }

    setIsPrinting(true);
    try {
      let result;
      
      const baudRate = Number(cafeSettings.printer_baud_rate) || 9600;

      if (printerType === 'usb' && selectedPrinter) {
        // Print to USB thermal printer
        thermalPrinterManager.setSelectedPrinter(selectedPrinter as any);
        result = await thermalPrinterManager.print(printPreview, 'usb');
      } else if (printerType === 'serial') {
        // Print to serial thermal printer (baud from cafe settings)
        result = await thermalPrinterManager.print(printPreview, 'serial', { baudRate });
      } else {
        // Print using system print dialog
        result = await thermalPrinterManager.print(printPreview, 'system');
      }
      
      if (result.success) {
        toast.success(result.message || 'Printed successfully');
        onPrintSuccess && onPrintSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Printing failed');
      }
    } catch (error) {
      console.error('Printing error:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Printing failed: ' + msg);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrinterSelect = (printer) => {
    setSelectedPrinter(printer);
    setPrinterType(printer.type);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title={`Print Order #${order?.order_number || ''}`} size="4xl">
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Left Panel - Printer Selection */}
          <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-4 sm:p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Printer Detection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Available Printers
                  </h3>
                  <button
                    onClick={detectPrinters}
                    disabled={isDetecting}
                    className="flex items-center space-x-1 text-sm text-secondary-600 hover:text-secondary-700 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isDetecting ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {isDetecting && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Detecting printers...
                  </div>
                )}

                {printers.length === 0 && !isDetecting && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No printers detected. You can still print using the system print dialog.
                  </div>
                )}

                {/* Printer List */}
                <div className="space-y-2">
                  {printers.map((printer) => (
                    <div
                      key={`${printer.type}-${String(printer.id)}`}
                      onClick={() => handlePrinterSelect(printer)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPrinter?.id === printer.id
                          ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {printer.type === 'usb' ? (
                          <Usb className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Wifi className="h-4 w-4 text-green-500" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {printer.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {printer.type === 'usb' ? 'USB Thermal Printer' : 'System Printer'}
                          </div>
                        </div>
                        {selectedPrinter?.id === printer.id && (
                          <CheckCircle className="h-5 w-5 text-secondary-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Manual Print Options */}
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPrinterType('system');
                      setSelectedPrinter(null);
                    }}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      printerType === 'system'
                        ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          System Print Dialog
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Use browser print dialog
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPrinterType('serial');
                      setSelectedPrinter(null);
                    }}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      printerType === 'serial'
                        ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Usb className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          Serial Port Printer
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Connect via serial port
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Print Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isPrinting || previewLoading || !printPreview.trim()}
                  className="w-full bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 min-h-[44px] rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isPrinting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Printing...</span>
                    </>
                  ) : previewLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Loading receipt...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="h-5 w-5" />
                      <span>Print Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Print Preview */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Print Preview
              </h3>
              
              <div className="card card-sm">
                <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-tight">
                  {previewLoading ? 'Loading preview...' : printPreview || 'No preview yet.'}
                </pre>
              </div>
            </div>
          </div>
        </div>
    </Dialog>
  );
};

export default PrintModal; 