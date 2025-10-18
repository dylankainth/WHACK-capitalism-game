import React from "react";

export default function ARBoard() {
    return (
        <>
            <a-scene
                embedded
                arjs="sourceType: webcam; debugUIEnabled: false;"
                vr-mode-ui="enabled: false"
            >
                {/* Four corner markers */}
                <a-marker type="pattern" url="/markers/corner1.patt" id="corner1">
                    <a-box position="0 0.25 0" color="red" scale="0.5 0.5 0.5"></a-box>
                </a-marker>

                <a-marker type="pattern" url="/markers/corner2.patt" id="corner2">
                    <a-box position="0 0.25 0" color="green" scale="0.5 0.5 0.5"></a-box>
                </a-marker>

                <a-marker type="pattern" url="/markers/corner3.patt" id="corner3">
                    <a-box position="0 0.25 0" color="blue" scale="0.5 0.5 0.5"></a-box>
                </a-marker>

                <a-marker type="pattern" url="/markers/corner4.patt" id="corner4">
                    <a-box position="0 0.25 0" color="yellow" scale="0.5 0.5 0.5"></a-box>
                </a-marker>

                {/* Camera */}
                <a-entity camera></a-entity>
            </a-scene>
        </>
    );
}
