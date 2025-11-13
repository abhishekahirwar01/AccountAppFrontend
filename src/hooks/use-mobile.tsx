import * as React from "react"

const MOBILE_BREAKPOINT = 768
const OVERLAY_BREAKPOINT = 1280

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Initial check
    checkDevice()

    window.addEventListener("resize", checkDevice)

    return () => {
      window.removeEventListener("resize", checkDevice)
    }
  }, [])

  return isMobile
}

export function useIsOverlay() {
  const [isOverlay, setIsOverlay] = React.useState(false)

  React.useEffect(() => {
    const checkDevice = () => {
      setIsOverlay(window.innerWidth < OVERLAY_BREAKPOINT)
    }

    // Initial check
    checkDevice()

    window.addEventListener("resize", checkDevice)

    return () => {
      window.removeEventListener("resize", checkDevice)
    }
  }, [])

  return isOverlay
}
