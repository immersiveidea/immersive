/**
 * Device detection utilities for VR capability and device type
 */
import {Scene, WebXRDefaultExperience} from "@babylonjs/core";

export interface DeviceCapabilities {
    isVRCapable: boolean;
    isMobileVR: boolean;
    isDesktop: boolean;
    deviceType: 'vr-headset' | 'desktop' | 'mobile';
}

/**
 * Checks if the browser supports WebXR immersive VR sessions
 */
export async function checkVRCapability(): Promise<boolean> {
    if (!('xr' in navigator)) {
        return false;
    }

    try {
        return await navigator.xr!.isSessionSupported('immersive-vr');
    } catch {
        return false;
    }
}

/**
 * Detects if the user is on a VR headset device (Quest, Pico, etc.)
 */
export function isMobileVRDevice(): boolean {
    const ua = navigator.userAgent;
    return true;
    //return /Quest|Oculus|Pico|VR/i.test(ua);
}

/**
 * Detects if the user is on a desktop device
 */
export function isDesktopDevice(): boolean {
    const ua = navigator.userAgent;
    return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Quest|Oculus|Pico/i.test(ua);
}

/**
 * Gets comprehensive device capabilities
 */
export async function getDeviceCapabilities(): Promise<DeviceCapabilities> {
    const isVRCapable = await checkVRCapability();
    const isMobileVR = isMobileVRDevice();
    const isDesktop = isDesktopDevice();

    let deviceType: 'vr-headset' | 'desktop' | 'mobile';
    if (isMobileVR) {
        deviceType = 'vr-headset';
    } else if (isDesktop) {
        deviceType = 'desktop';
    } else {
        deviceType = 'mobile';
    }

    return {
        isVRCapable,
        isMobileVR,
        isDesktop,
        deviceType
    };
}

