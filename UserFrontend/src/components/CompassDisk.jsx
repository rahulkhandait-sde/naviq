"use client"

import { useEffect, useState } from "react"

const CompassDisk = () => {
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    const handleOrientation = (event) => {
      const alpha = event.alpha
      if (alpha !== null) {
        // Rotate the disk, keep needle fixed
        setRotation(-alpha)
      }
    }

    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientationabsolute", handleOrientation, true)

      // Fallback for devices that don't support deviceorientationabsolute
      window.addEventListener("deviceorientation", handleOrientation, true)
    }

    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation, true)
      window.removeEventListener("deviceorientation", handleOrientation, true)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <div className="w-20 h-20 border-2 border-gray-800 rounded-full relative bg-gray-100 overflow-hidden shadow-lg">
        {/* Disk with directions */}
        <div
          className="w-full h-full absolute top-0 left-0 rounded-full transition-transform duration-100"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 font-bold text-xs">N</div>
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 font-bold text-xs">S</div>
          <div className="absolute top-1/2 left-1 transform -translate-y-1/2 font-bold text-xs">E</div>
          <div className="absolute top-1/2 right-1 transform -translate-y-1/2 font-bold text-xs">W</div>
        </div>

        {/* Needle fixed */}
        <div className="w-1 h-8 bg-red-500 absolute top-2 left-1/2 transform -translate-x-1/2 z-10"></div>
      </div>
    </div>
  )
}

export default CompassDisk
