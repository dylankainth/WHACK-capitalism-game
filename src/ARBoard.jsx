import React, { useEffect } from "react";

export default function ARBoard() {
    useEffect(() => {
        // Force continuous autofocus when component mounts
        const video = document.querySelector('video');
        if (video && video.srcObject) {
            const track = video.srcObject.getVideoTracks()[0];
            if (track && track.getCapabilities) {
                const capabilities = track.getCapabilities();
                if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                    track.applyConstraints({
                        advanced: [{ focusMode: 'continuous' }]
                    }).catch(err => console.log('Focus constraint failed:', err));
                }
            }
        }
    }, []);

    return (
        <>
            <a-scene
                embedded
                arjs="sourceType: webcam; debugUIEnabled: true; sourceWidth: 1280; sourceHeight: 720; displayWidth: 1280; displayHeight: 720;"
                vr-mode-ui="enabled: false"
            >
                {/* Test with preset Hiro marker first */}
                <a-marker preset="hiro">
                    <a-box position="0 0.25 0" color="red" scale="0.5 0.5 0.5"></a-box>
                </a-marker>



                {/* Camera */}
                <a-entity camera></a-entity>
            </a-scene>
        </>
    );
}
