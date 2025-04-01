import { QRCodeSVG } from "qrcode.react";

interface QRModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrData: string;
    orderId: string;
  }
  
  const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, qrData, orderId }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Order #{orderId.substring(0, 8)}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          <div className="flex flex-col items-center">
            <QRCodeSVG
              value={qrData}
              size={256}
              level="H"
              includeMargin={true}
            />
            <p className="mt-4 text-sm text-gray-600 text-center">
              Scan this QR code to update product status
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };