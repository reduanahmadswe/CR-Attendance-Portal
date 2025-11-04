import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCloseQRSessionMutation, useGenerateQRSessionMutation, useGetActiveQRSessionQuery, useGetQRSessionStatsQuery } from '@/lib/apiSlice';
import type { AttendanceSession, Course } from '@/types';
import { Clock, MapPin, QrCode, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface QRGeneratorProps {
  sectionId: string;
  courses: Course[];
}

export function QRGenerator({ sectionId, courses }: QRGeneratorProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [duration, setDuration] = useState<number>(15);
  const [allowedRadius, setAllowedRadius] = useState<number>(100);
  const [antiCheatEnabled, setAntiCheatEnabled] = useState<boolean>(true);
  const [useLocation, setUseLocation] = useState<boolean>(true);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);

  const [generateQR, { isLoading: isGenerating }] = useGenerateQRSessionMutation();
  const [closeSession, { isLoading: isClosing }] = useCloseQRSessionMutation();

  // Fetch active session when course is selected
  const { data: activeSessionData, refetch: refetchActiveSession } = useGetActiveQRSessionQuery(
    { sectionId, courseId: selectedCourseId },
    { skip: !selectedCourseId }
  );

  // Fetch session stats if there's an active session
  const { data: statsData } = useGetQRSessionStatsQuery(
    activeSession?.sessionId || '',
    { skip: !activeSession?.sessionId, pollingInterval: 5000 } // Poll every 5 seconds
  );

  useEffect(() => {
    if (activeSessionData?.data) {
      setActiveSession(activeSessionData.data);
    }
  }, [activeSessionData]);

  // Get current location
  useEffect(() => {
    if (useLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
          toast.success('Location obtained successfully');
        },
        (error) => {
          toast.error('Failed to get location: ' + error.message);
          setUseLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [useLocation]);

  const handleGenerate = async () => {
    if (!selectedCourseId) {
      toast.error('Please select a course');
      return;
    }

    if (useLocation && !currentLocation) {
      toast.error('Waiting for location...');
      return;
    }

    try {
      const result = await generateQR({
        sectionId,
        courseId: selectedCourseId,
        duration,
        ...(useLocation && currentLocation && {
          location: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            accuracy: currentLocation.coords.accuracy,
          },
        }),
        allowedRadius,
        antiCheatEnabled,
      }).unwrap();

      if (result.data) {
        setActiveSession(result.data.session);
        toast.success('QR Code generated successfully!');
      }
    } catch (error: unknown) {
      const apiError = error as { data?: { message?: string } };
      toast.error(apiError?.data?.message || 'Failed to generate QR code');
    }
  };

  const handleClose = async () => {
    if (!activeSession) return;

    try {
      await closeSession({
        sessionId: activeSession.sessionId,
        data: { generateAttendanceRecord: true },
      }).unwrap();

      toast.success('Session closed successfully!');
      setActiveSession(null);
      refetchActiveSession();
    } catch (error: unknown) {
      const apiError = error as { data?: { message?: string } };
      toast.error(apiError?.data?.message || 'Failed to close session');
    }
  };

  const getTimeRemaining = () => {
    if (!activeSession) return null;
    const now = new Date().getTime();
    const expiresAt = new Date(activeSession.expiresAt).getTime();
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const stats = statsData?.data;

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      {!activeSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Generate QR Attendance
            </CardTitle>
            <CardDescription>
              Create a QR code for students to scan and mark their attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course">Select Course *</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger id="course">
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.name} {course.code && `(${course.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="120"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">Allowed Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  min="10"
                  max="1000"
                  value={allowedRadius}
                  onChange={(e) => setAllowedRadius(Number(e.target.value))}
                  disabled={!useLocation}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="location">Use Location Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Ensure students are in classroom
                </p>
              </div>
              <Switch
                id="location"
                checked={useLocation}
                onCheckedChange={setUseLocation}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="anticheat">Enable Anti-Cheat</Label>
                <p className="text-sm text-muted-foreground">
                  Detect fake location and duplicate scans
                </p>
              </div>
              <Switch
                id="anticheat"
                checked={antiCheatEnabled}
                onCheckedChange={setAntiCheatEnabled}
              />
            </div>

            {useLocation && currentLocation && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  Location: {currentLocation.coords.latitude.toFixed(6)},{' '}
                  {currentLocation.coords.longitude.toFixed(6)}
                  {' '}(±{Math.round(currentLocation.coords.accuracy)}m)
                </span>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedCourseId}
              className="w-full"
              size="lg"
            >
              <QrCode className="mr-2 h-5 w-5" />
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Session Display */}
      {activeSession && (
        <div className="space-y-4">
          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-green-600" />
                  Active Session
                </CardTitle>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClose}
                  disabled={isClosing}
                >
                  <X className="mr-2 h-4 w-4" />
                  Close Session
                </Button>
              </div>
              <CardDescription>
                Students can scan this QR code to mark attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Image */}
              <div className="flex justify-center">
                <div className="relative inline-block">
                  <img
                    src={activeSession.qrCode}
                    alt="Attendance QR Code"
                    className="w-96 h-96 border-4 border-primary rounded-lg shadow-lg"
                  />
                  {/* Timer positioned outside QR code */}
                  {getTimeRemaining() && (
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-lg flex items-center gap-2 shadow-lg">
                      <Clock className="h-5 w-5" />
                      {getTimeRemaining()}
                    </div>
                  )}
                </div>
              </div>

              {/* Add spacing for timer */}
              <div className="h-8"></div>

              {/* Session Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Course</p>
                  <p className="font-medium">
                    {typeof activeSession.courseId === 'object' 
                      ? activeSession.courseId.name 
                      : 'Loading...'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{activeSession.maxDuration} minutes</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Radius</p>
                  <p className="font-medium">{activeSession.allowedRadius}m</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Anti-Cheat</p>
                  <p className="font-medium">
                    {activeSession.antiCheatEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Statistics */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Live Attendance Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-green-600">
                      {stats.attendance.attendedCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-red-600">
                      {stats.attendance.absentCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Absent</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">
                      {stats.attendance.attendanceRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Rate</p>
                  </div>
                </div>

                {/* Recent Scans */}
                {stats.recentScans.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recent Scans</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {stats.recentScans.map((scan, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                        >
                          <span className="font-medium">
                            {typeof scan.student === 'object' 
                              ? `${scan.student.name} (${scan.student.studentId})`
                              : 'Loading...'}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(scan.scannedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
