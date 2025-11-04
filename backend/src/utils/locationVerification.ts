import { getDistance } from 'geolib';

export interface LocationCoordinates {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

export interface LocationVerificationResult {
    isValid: boolean;
    distance?: number;
    reason?: string;
}

/**
 * Verify if student's location is within allowed radius of the session location
 * @param sessionLocation - Location where class is being held
 * @param studentLocation - Student's current location
 * @param allowedRadius - Maximum allowed distance in meters
 * @returns Verification result with distance and validity
 */
export const verifyLocation = (
    sessionLocation: LocationCoordinates,
    studentLocation: LocationCoordinates,
    allowedRadius: number = 100
): LocationVerificationResult => {
    try {
        // Validate coordinates
        if (!isValidCoordinates(sessionLocation) || !isValidCoordinates(studentLocation)) {
            return {
                isValid: false,
                reason: 'Invalid coordinates provided',
            };
        }

        // Calculate distance between two locations in meters
        const distance = getDistance(
            {
                latitude: sessionLocation.latitude,
                longitude: sessionLocation.longitude,
            },
            {
                latitude: studentLocation.latitude,
                longitude: studentLocation.longitude,
            }
        );

        // Consider accuracy if provided
        const accuracyBuffer = (studentLocation.accuracy || 0) + (sessionLocation.accuracy || 0);
        const effectiveRadius = allowedRadius + accuracyBuffer;

        const isValid = distance <= effectiveRadius;

        return {
            isValid,
            distance,
            reason: isValid 
                ? 'Location verified successfully' 
                : `You are ${distance}m away from the classroom (allowed: ${allowedRadius}m)`,
        };
    } catch (error) {
        console.error('Error verifying location:', error);
        return {
            isValid: false,
            reason: 'Failed to verify location',
        };
    }
};

/**
 * Validate if coordinates are within valid ranges
 */
export const isValidCoordinates = (location: LocationCoordinates): boolean => {
    const { latitude, longitude } = location;
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return false;
    }

    // Check if latitude is between -90 and 90
    if (latitude < -90 || latitude > 90) {
        return false;
    }

    // Check if longitude is between -180 and 180
    if (longitude < -180 || longitude > 180) {
        return false;
    }

    return true;
};

/**
 * Detect if location might be spoofed (basic checks)
 */
export const detectLocationSpoofing = (
    location: LocationCoordinates,
    previousLocation?: LocationCoordinates,
    timeElapsedSeconds?: number
): { isSuspicious: boolean; reason?: string } => {
    // Check 1: Exact same coordinates with high accuracy (suspicious)
    if (
        location.accuracy !== undefined && 
        location.accuracy < 5 && 
        Number.isInteger(location.latitude * 1000000) && 
        Number.isInteger(location.longitude * 1000000)
    ) {
        return {
            isSuspicious: true,
            reason: 'Suspiciously accurate coordinates',
        };
    }

    // Check 2: Impossible speed (if previous location available)
    if (previousLocation && timeElapsedSeconds) {
        const distance = getDistance(
            { latitude: previousLocation.latitude, longitude: previousLocation.longitude },
            { latitude: location.latitude, longitude: location.longitude }
        );

        // Calculate speed in m/s
        const speed = distance / timeElapsedSeconds;
        const maxHumanSpeed = 15; // ~54 km/h (faster than running)

        if (speed > maxHumanSpeed) {
            return {
                isSuspicious: true,
                reason: 'Impossible movement speed detected',
            };
        }
    }

    // Check 3: Default/null island coordinates (0, 0)
    if (location.latitude === 0 && location.longitude === 0) {
        return {
            isSuspicious: true,
            reason: 'Invalid null island coordinates',
        };
    }

    return { isSuspicious: false };
};

/**
 * Get human-readable distance string
 */
export const formatDistance = (meters: number): string => {
    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
};

/**
 * Calculate recommended radius based on venue type
 */
export const getRecommendedRadius = (venueType: 'classroom' | 'lab' | 'auditorium' | 'outdoor'): number => {
    const radiusMap = {
        classroom: 50,    // 50 meters
        lab: 75,          // 75 meters
        auditorium: 100,  // 100 meters
        outdoor: 200,     // 200 meters
    };

    return radiusMap[venueType] || 100;
};

/**
 * Check if current time is within session time window
 */
export const isWithinSessionTime = (
    startTime: Date,
    endTime: Date,
    currentTime: Date = new Date(),
    bufferMinutes: number = 5
): boolean => {
    const bufferMs = bufferMinutes * 60 * 1000;
    const adjustedStartTime = new Date(startTime.getTime() - bufferMs);
    const adjustedEndTime = new Date(endTime.getTime() + bufferMs);

    return currentTime >= adjustedStartTime && currentTime <= adjustedEndTime;
};

/**
 * Generate geofence coordinates (polygon) around a point
 * Useful for advanced geofencing implementations
 */
export const generateGeofencePolygon = (
    center: LocationCoordinates,
    radiusMeters: number,
    points: number = 16
): LocationCoordinates[] => {
    const polygon: LocationCoordinates[] = [];
    const earthRadius = 6371000; // Earth's radius in meters

    for (let i = 0; i < points; i++) {
        const angle = (360 / points) * i;
        const angleRad = (angle * Math.PI) / 180;

        const lat1 = (center.latitude * Math.PI) / 180;
        const lon1 = (center.longitude * Math.PI) / 180;

        const lat2 = Math.asin(
            Math.sin(lat1) * Math.cos(radiusMeters / earthRadius) +
            Math.cos(lat1) * Math.sin(radiusMeters / earthRadius) * Math.cos(angleRad)
        );

        const lon2 = lon1 + Math.atan2(
            Math.sin(angleRad) * Math.sin(radiusMeters / earthRadius) * Math.cos(lat1),
            Math.cos(radiusMeters / earthRadius) - Math.sin(lat1) * Math.sin(lat2)
        );

        polygon.push({
            latitude: (lat2 * 180) / Math.PI,
            longitude: (lon2 * 180) / Math.PI,
        });
    }

    return polygon;
};
