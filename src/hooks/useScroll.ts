'use client'

import { useState, useEffect } from 'react'

export function useScroll() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      setIsScrolled(currentScrollY > 10)
    }

    // Écouter le scroll
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Nettoyer l'event listener
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return {
    isScrolled,
    scrollY,
    scrollDirection: scrollY > 0 ? 'down' : 'up'
  }
}


