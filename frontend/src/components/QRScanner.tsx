import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useScanQRCodeMutation } from '@/lib/apiSlice';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle, Loader2, QrCode, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface QRScannerProps {
  studentId: string;
  onSuccess?: () => void;
}

export function QRScanner({ studentId, onSuccess }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [resultMessage, setResultMessage] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);

  const [scanQR, { isLoading: isSubmitting }] = useScanQRCodeMutation();

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
        },
        (error) => {
          console.warn('Location error:', error);
          // Continue without location
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setScanResult(null);
      setResultMessage('');

      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText: string) => {
          // QR Code detected
          await handleScan(decodedText);
        },
        (errorMessage: string) => {
          // Scanning errors (can be ignored)
          console.log('Scan error:', errorMessage);
        }
      );
    } catch (error) {
      console.error('Error starting scanner:', error);
      toast.error('Failed to start camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setIsScanning(false);
  };

  const handleScan = async (qrCodeData: string) => {
    // Stop scanner immediately
    await stopScanning();

    try {
      const result = await scanQR({
        qrCodeData,
        studentId,
        ...(currentLocation && {
          location: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            accuracy: currentLocation.coords.accuracy,
          },
        }),
        deviceInfo: navigator.userAgent,
      }).unwrap();

      setScanResult('success');
      setResultMessage(result.message || 'Attendance marked successfully!');
      toast.success('Attendance marked successfully!');
      
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (error: unknown) {
      const apiError = error as { data?: { message?: string } };
      const errorMessage = apiError?.data?.message || 'Failed to mark attendance';
      setScanResult('error');
      setResultMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setResultMessage('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Scan QR Code
        </CardTitle>
        <CardDescription>
          Scan the QR code displayed by your CR to mark attendance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner Area */}
        {!scanResult && (
          <>
            <div
              id="qr-reader"
              className={`${isScanning ? 'block' : 'hidden'} rounded-lg overflow-hidden`}
            />

            {!isScanning && (
              <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
                <Camera className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Click the button below to start scanning
                </p>
              </div>
            )}

            <Button
              onClick={isScanning ? stopScanning : startScanning}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
              variant={isScanning ? 'destructive' : 'default'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Marking Attendance...
                </>
              ) : isScanning ? (
                <>
                  <XCircle className="mr-2 h-5 w-5" />
                  Stop Scanning
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  Start Scanning
                </>
              )}
            </Button>
          </>
        )}

        {/* Result Display */}
        {scanResult && (
          <div className="space-y-4">
            <div
              className={`flex flex-col items-center justify-center h-64 rounded-lg ${
                scanResult === 'success'
                  ? 'bg-green-50'
                  : 'bg-red-50'
              }`}
            >
              {scanResult === 'success' ? (
                <>
                  <CheckCircle className="h-20 w-20 text-green-600 mb-4" />
                  <h3 className="text-xl font-bold text-green-700">
                    Success!
                  </h3>
                  <p className="text-center text-green-600 mt-2 px-4">
                    {resultMessage}
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="h-20 w-20 text-red-600 mb-4" />
                  <h3 className="text-xl font-bold text-red-700">
                    Failed
                  </h3>
                  <p className="text-center text-red-600 mt-2 px-4">
                    {resultMessage}
                  </p>
                </>
              )}
            </div>

            <Button onClick={handleReset} className="w-full" size="lg">
              Scan Another QR Code
            </Button>
          </div>
        )}

        {/* Location Status */}
        {!scanResult && (
          <div className="text-xs text-center text-muted-foreground">
            {currentLocation ? (
              <span className="text-green-600">✓ Location enabled</span>
            ) : (
              <span className="text-yellow-600">⚠ Location not available</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
