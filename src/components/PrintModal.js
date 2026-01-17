import React, { useState, useEffect } from 'react';
import { X, Printer, Usb, Wifi, Settings, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import thermalPrinterManager from '../utils/thermalPrinter';
import toast from 'react-hot-toast';

const PrintModal = ({ isOpen, onClose, order, onPrintSuccess }) => {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [printerType, setPrinterType] = useState('system');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printPreview, setPrintPreview] = useState('');

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
    if (!order) return;
    
    try {
      // Get print content from backend
      const response = await fetch(`/api/orders/${order.id}/print`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const content = await response.text();
        setPrintPreview(content);
      }
    } catch (error) {
      console.error('Error generating print preview:', error);
    }
  };

  const handlePrint = async () => {
    if (!order) return;
    
    setIsPrinting(true);
    try {
      let result;
      
      if (printerType === 'usb' && selectedPrinter) {
        // Print to USB thermal printer
        thermalPrinterManager.setSelectedPrinter(selectedPrinter);
        result = await thermalPrinterManager.print(printPreview, 'usb');
      } else if (printerType === 'serial') {
        // Print to serial thermal printer
        result = await thermalPrinterManager.print(printPreview, 'serial');
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
      toast.error('Printing failed: ' + error.message);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrinterSelect = (printer) => {
    setSelectedPrinter(printer);
    setPrinterType(printer.type);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end lg:items-center justify-center z-50 p-0 lg:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-lg lg:rounded-lg shadow-xl max-w-4xl w-full lg:mx-4 h-[90vh] lg:h-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Printer className="h-6 w-6 text-secondary-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Print Order #{order?.order_number}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
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
                      key={printer.id}
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
                    onClick={() => setPrinterType('system')}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      printerType === 'system' && !selectedPrinter
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
                    onClick={() => setPrinterType('serial')}
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
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="w-full bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 min-h-[44px] rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isPrinting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Printing...</span>
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
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-tight">
                  {printPreview || 'Loading preview...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintModal; 