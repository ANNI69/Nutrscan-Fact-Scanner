"use client";

import { useEffect, useCallback, useRef } from "react";

export default function Scanner({ handleResult }) {

  const videoRef = useRef(null);

  useEffect(() => {
    if( videoRef!==null && videoRef.current!==null ){
      const initCamera = async () => {
        try {
          const myFrameWidth = document.getElementById('myFrame').offsetWidth;
          const myFrameHeight = document.getElementById('myFrame').offsetHeight;
          console.log('#myFrame dims:', myFrameWidth, myFrameHeight);

          const stream = await navigator.mediaDevices.getUserMedia(
            {
              audio: false,
              video: {
                facingMode: 'environment',
                height: myFrameWidth,
                width: myFrameHeight
              }
            }
          );
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          // Log the dimensions of the video stream
          videoRef.current.onloadedmetadata = () => {
            console.log('Video Dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        };
        } catch (error) {
          console.error('Error accessing camera:', error);
        }
      };
      initCamera();
  
      return () => {
        // Cleanup the camera stream when the component is unmounted
        const stream = videoRef.current.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }
      };
    }
  }, []);

  const handleBarcodeDetection = async () => {
  
    // Get canvas and context
    const myCanvas = document.getElementById('myCanvas');
    const ctx = myCanvas.getContext("2d");
    // set myCanvas width and height to match videoRef.current.videoWidth and videoRef.current.videoHeight
    myCanvas.width = videoRef.current.videoWidth;
    myCanvas.height = videoRef.current.videoHeight;

    
    const video = videoRef.current;

    const barcodeDetector = new BarcodeDetector();
    
    const myInterval = window.setInterval(async () => {
      const barcodes = await barcodeDetector.detect(video);
      if (barcodes.length <= 0) {
        // ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
        return;
      }

      // send result to parent
      handleResult(barcodes[0].rawValue);
      // Pause video and stop barcode detection interval
      videoRef.current.pause();
      clearInterval(myInterval);

      console.log("Detected Barcode:", barcodes[0]);

      console.log('#myCanvas dims:', myCanvas.width, myCanvas.height);

      // Clear prev drawing and draw new bounding box
      ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
      ctx.beginPath()
      ctx.lineWidth = "3";
      ctx.strokeStyle = "red";
      ctx.moveTo(barcodes[0].cornerPoints[0].x, barcodes[0].cornerPoints[0].y);
      ctx.lineTo(barcodes[0].cornerPoints[1].x, barcodes[0].cornerPoints[1].y);
      ctx.lineTo(barcodes[0].cornerPoints[2].x, barcodes[0].cornerPoints[2].y);
      ctx.lineTo(barcodes[0].cornerPoints[3].x, barcodes[0].cornerPoints[3].y);
      ctx.closePath();
      ctx.stroke();
/*
barcodes[0].cornerPoints format:
{
    "boundingBox": {
        "x": 142,
        "y": 392,
        "width": 97,
        "height": 103,
        "top": 392,
        "right": 239,
        "bottom": 495,
        "left": 142
    },
    "cornerPoints": [
        {"x": 142, "y": 396},
        {"x": 237, "y": 392},
        {"x": 239, "y": 491},
        {"x": 144, "y": 495}
    ],
    "format": "ean_8",
    "rawValue": "00649094"
}
*/
    }, 1000);
  };


  if ( !isBarcodeDetectorAvailable() ) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <p><a href="https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API">Barcode Detector API</a> is not supported by pc browsers!</p>
        <p>Please open this page in your mobile browser.</p>
      </div>
    )
  }

  return (
    <div id="myFrame" className="relative w-full h-3/4">
      <video id="scanner" className="w-full h-full" ref={videoRef} onLoadedMetadata={handleBarcodeDetection}>
        Your browser does not support the video tag.
      </video>
      <canvas id="myCanvas" className="absolute top-0 left-0" width={200} height={300}></canvas>
    </div>
  )
}

export function isBarcodeDetectorAvailable(){
  return ("BarcodeDetector" in window);
};
