"use client";

import { useState, useEffect, useRef } from "react";

import { CloseIcon } from "./Icons";

export default function Scanner({ handleResult }: { handleResult: (b: string) => void }) {

  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState(true);
  const [cameraAccess, setCameraAccess] = useState(false);
  const [barcodeDetectorSupported, setBarcodeDetectorSupported] = useState(true);

  useEffect(() => {
    if( !isBarcodeDetectorAvailable() )
      setBarcodeDetectorSupported(false);
  }, [barcodeDetectorSupported]);

  useEffect(() => {
    (async () => {
      if( videoRef!==null && videoRef.current!==null ){
        if ( status && typeof window !== 'undefined' ) {
          await startStream();
          if( cameraAccess && isBarcodeDetectorAvailable() )
            runBarcodeDetection();
        } else {
          stopStream();
        }
      }
    })();
    return stopStream;
  }, [status, cameraAccess]);

  const startStream = async () => {
    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia(
        {
          audio: false,
          video: {
            facingMode: 'environment',
            height: frameRef.current?.offsetWidth || 300,
            width: frameRef.current?.offsetHeight || 300
          }
        }
      );
      if ( videoRef.current ) {
        setCameraAccess(true);
        streamRef.current = stream;

        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      };
    } catch (error) {
      setCameraAccess(false);
      console.error('Error accessing camera:', error);
    }
  };

  const stopStream = () => {
    if ( streamRef.current ) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach( track => track.stop() );
    }
  }

  const runBarcodeDetection = () => {

    if(canvasRef.current===null || videoRef.current===null) return;

    const ctx = canvasRef.current.getContext("2d");
    if(ctx===null) return;
    // set canvas width and height to match videoRef.current.videoWidth and videoRef.current.videoHeight
    const { videoWidth, videoHeight } = videoRef.current;
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const barcodeDetector = new (window as any).BarcodeDetector({
      formats: ['upc_a', 'ean_8', 'ean_13']
    });

    // Barcode formats not supported
    if ( !barcodeDetector ){
      setBarcodeDetectorSupported(false);
      return;
    }

    const myInterval = setInterval(async () => {

      await barcodeDetector.detect( videoRef.current ).then((barcodes: any) => {
        if (barcodes.length === 0)
          return;

        //! I don't know why interval not clearing!
        clearInterval(myInterval);

        // Clear prev drawing and draw new bounding box
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        // Add a shot of the video stream to the canvas
        if (videoRef.current)
          ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
        ctx.beginPath()
        ctx.lineWidth = 3;
        ctx.strokeStyle = "red";
        ctx.moveTo(barcodes[0].cornerPoints[0].x, barcodes[0].cornerPoints[0].y);
        ctx.lineTo(barcodes[0].cornerPoints[1].x, barcodes[0].cornerPoints[1].y);
        ctx.lineTo(barcodes[0].cornerPoints[2].x, barcodes[0].cornerPoints[2].y);
        ctx.lineTo(barcodes[0].cornerPoints[3].x, barcodes[0].cornerPoints[3].y);
        ctx.closePath();
        ctx.stroke();

        // send result to parent
        handleResult(barcodes[0].rawValue);
        // Pause video and stop barcode detection interval
        setStatus(false);
      }).catch((error: any) => {
        console.error('Barcode detection failed:', error);
      });

    }, 1000);
  };


  return (
    <div ref={frameRef} className="relative w-full aspect-square my-4 overflow-hidden border" style={{ borderColor: "var(--background-3)" }}>
      <video className="w-full h-full object-cover" ref={videoRef} onLoadedMetadata={()=>setStatus(true)}>
        Your browser does not support the video tag.
      </video>
      <canvas id="myCanvas" ref={canvasRef} className="absolute top-0 left-0" width={200} height={300}></canvas>
      {!status && <button className='absolute top-0 right-0 m-3' onClick={()=>setStatus(true)} aria-label="Close">
        <CloseIcon size={22} />
      </button>}
      {!cameraAccess &&
        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center p-4 text-center" style={{ backgroundColor: "rgba(241,245,249,0.8)" }}>
          <p className="text-xl text-primary">Camera access is not granted!</p>
          <p className="text-text-1">Please allow camera access to scan barcodes.</p>
        </div>
      }
      {cameraAccess && !barcodeDetectorSupported &&
        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center p-4 text-center" style={{ backgroundColor: "rgba(241,245,249,0.8)" }}>
          <p className="text-primary">
            <a href="https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API"><u>Barcode Detector API</u></a> is not supported by your <a href="https://caniuse.com/mdn-api_barcodedetector"><u>browsers</u></a>!
          </p>
          <p className="text-text-1">Please open this page in your mobile browser (Chrome or Opera).</p>
        </div>
      }
    </div>
  )
}

function isBarcodeDetectorAvailable(){
  return (typeof window !== undefined && "BarcodeDetector" in window);
};
