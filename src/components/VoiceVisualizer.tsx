
import React, { useRef, useState, useEffect } from 'react'

type AgentState =
  | 'disconnected'
  | 'connecting'
  | 'initializing'
  | 'listening'
  | 'thinking'
  | 'speaking'

interface CanvasProps {
  size?: number // Taille du canvas
  state: AgentState // État de l'agent
  audioLevel?: number // Niveau audio pour l'animation entre -1 et 1
}

// Interface pour les particules qui formeront les arcs autour de la sphère
interface Particle {
  x: number
  y: number
  size: number
  color: string
  angle: number
  speed: number
  distance: number
  opacity: number
  active: boolean
}

// Interface pour les couleurs selon l'état
interface StateColors {
  primary: string
  secondary: string
  tertiary: string
  glow: string
}

const VoiceVisualizer: React.FC<CanvasProps> = ({
  size = 300,
  state = 'disconnected',
  audioLevel = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const frameInterval = 1000 / 30 // Limiter à environ 30 FPS pour économiser les ressources
  
  // Variables pour l'animation de la sphère
  const particlesRef = useRef<Particle[]>([])
  const rotationRef = useRef<number>(0)
  const pulseRef = useRef<number>(0)
  const timeRef = useRef<number>(0)
  
  // Couleurs pour chaque état
  const stateColorsRef = useRef<Record<AgentState, StateColors>>({
    disconnected: {
      primary: 'rgba(150, 150, 180, 0.8)',
      secondary: 'rgba(130, 130, 160, 0.5)',
      tertiary: 'rgba(120, 120, 150, 0.3)',
      glow: 'rgba(140, 140, 170, 0.4)'
    },
    connecting: {
      primary: 'rgba(100, 140, 230, 0.8)',
      secondary: 'rgba(80, 120, 210, 0.5)',
      tertiary: 'rgba(60, 100, 190, 0.3)',
      glow: 'rgba(90, 130, 220, 0.4)'
    },
    initializing: {
      primary: 'rgba(110, 150, 240, 0.8)',
      secondary: 'rgba(90, 130, 220, 0.5)',
      tertiary: 'rgba(70, 110, 200, 0.3)',
      glow: 'rgba(100, 140, 230, 0.4)'
    },
    listening: {
      primary: 'rgba(120, 160, 250, 0.8)',
      secondary: 'rgba(100, 140, 230, 0.5)',
      tertiary: 'rgba(80, 120, 210, 0.3)',
      glow: 'rgba(110, 150, 240, 0.4)'
    },
    thinking: {
      primary: 'rgba(180, 130, 230, 0.8)',
      secondary: 'rgba(160, 110, 210, 0.5)',
      tertiary: 'rgba(140, 90, 190, 0.3)',
      glow: 'rgba(170, 120, 220, 0.4)'
    },
    speaking: {
      primary: 'rgba(220, 130, 180, 0.8)',
      secondary: 'rgba(200, 110, 160, 0.5)',
      tertiary: 'rgba(180, 90, 140, 0.3)',
      glow: 'rgba(210, 120, 170, 0.4)'
    }
  })

  // Initialize canvas - seulement une fois au démarrage
  useEffect(() => {
    if (!isInitialized) {
      const canvas = canvasRef.current
      if (!canvas) return

      // Set fixed dimensions with device pixel ratio for high-DPI displays
      const pixelRatio = Math.min(window.devicePixelRatio, 2)
      canvas.width = size * pixelRatio
      canvas.height = size * pixelRatio

      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`

      // Initialisation des particules
      initParticles()

      // Debug log
      console.log('Canvas initialized, size:', size, 'pixelRatio:', pixelRatio)

      setIsInitialized(true)
    }
  }, [size])

  // Initialisation des particules qui formeront les arcs autour de la sphère
  const initParticles = (): void => {
    const particles: Particle[] = []
    const particleCount = 100
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = (size / 3) * (0.8 + Math.random() * 0.3)
      const speed = 0.001 + Math.random() * 0.003
      
      particles.push({
        x: 0,
        y: 0,
        size: 1 + Math.random() * 2,
        color: getRandomColor(),
        angle,
        speed,
        distance,
        opacity: 0.1 + Math.random() * 0.7,
        active: Math.random() > 0.3
      })
    }
    
    particlesRef.current = particles
  }
  
  // Génère une couleur aléatoire dans la palette bleu-violet-rose
  const getRandomColor = (): string => {
    const colors = [
      'rgba(100, 140, 255, 0.8)',
      'rgba(140, 100, 255, 0.8)',
      'rgba(180, 100, 255, 0.8)',
      'rgba(220, 100, 220, 0.8)',
      'rgba(255, 100, 180, 0.8)'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Main animation loop - optimisé pour réduire la consommation
  useEffect(() => {
    if (!isInitialized) return

    // Démarrer l'animation avec le timestamp actuel
    animationRef.current = requestAnimationFrame(animate)
    
    // Nettoyage à la désinstallation du composant
    return (): void => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isInitialized])

  // Variable pour limiter le taux de rafraîchissement
  let lastFrameTime = performance.now()

  // Animation loop
  const animate = (timestamp: number): void => {
    if (!animationRef.current) return // Stop if animation was cancelled

    // Limiter le taux de rafraîchissement
    if (timestamp - lastFrameTime >= frameInterval) {
      lastFrameTime = timestamp
      
      // Mise à jour du temps pour les animations
      timeRef.current += 0.01
      
      // Récupérer le contexte et effacer le canvas
      const canvas = canvasRef.current
      if (!canvas) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      
      const ctx = canvas.getContext('2d', { alpha: true })
      if (!ctx) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      
      // Effacer le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Calculer le centre du canvas
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      
      // Ajuster la taille de la sphère en fonction du niveau audio
      const audioAdjustedLevel = Math.max(0, Math.min(1, (audioLevel + 1) / 2))
      const baseSize = size / 3
      const sphereSize = baseSize * (1 + audioAdjustedLevel * 0.2)
      
      // Mise à jour de l'animation de pulsation
      pulseRef.current += 0.05
      const pulseFactor = 1 + Math.sin(pulseRef.current) * 0.03
      
      // Mise à jour de la rotation
      rotationRef.current += 0.01
      
      // Récupérer les couleurs pour l'état actuel
      const colors = stateColorsRef.current[state]
      
      // Dessiner le glow externe
      const glowSize = sphereSize * 1.4 * pulseFactor
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, glowSize
      )
      glowGradient.addColorStop(0, colors.glow)
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2)
      ctx.fill()
      
      // Dessiner la sphère principale avec dégradé
      const gradient = ctx.createRadialGradient(
        centerX - sphereSize * 0.3, centerY - sphereSize * 0.3, 0,
        centerX, centerY, sphereSize
      )
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
      gradient.addColorStop(0.4, colors.primary)
      gradient.addColorStop(0.8, colors.secondary)
      gradient.addColorStop(1, colors.tertiary)
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, sphereSize, 0, Math.PI * 2)
      ctx.fill()
      
      // Dessiner les arcs interrompus autour de la sphère
      drawParticles(ctx, centerX, centerY, sphereSize, audioAdjustedLevel)
      
      // Ajouter des reflets pour l'effet 3D
      drawHighlights(ctx, centerX, centerY, sphereSize)
    }
    
    // Schedule next frame
    animationRef.current = requestAnimationFrame(animate)
  }
  
  // Fonction pour dessiner les particules formant les arcs interrompus
  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    sphereSize: number,
    audioLevel: number
  ): void => {
    // Mise à jour et dessin des particules
    particlesRef.current.forEach((particle, index) => {
      if (!particle.active) return
      
      // Mettre à jour l'angle pour faire tourner les particules
      particle.angle += particle.speed
      
      // Calculer la nouvelle position
      const distance = particle.distance * (1 + audioLevel * 0.3)
      particle.x = centerX + Math.cos(particle.angle) * distance
      particle.y = centerY + Math.sin(particle.angle) * distance
      
      // Taille variable en fonction du niveau audio
      const particleSize = particle.size * (1 + audioLevel * 0.5)
      
      // Opacité variable pour l'effet de scintillement
      const flickerFactor = 0.7 + Math.sin(timeRef.current * 5 + index) * 0.3
      const currentOpacity = particle.opacity * flickerFactor
      
      // Dessiner la particule
      ctx.beginPath()
      ctx.fillStyle = particle.color.replace('0.8', currentOpacity.toString())
      ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2)
      ctx.fill()
      
      // Connecter certaines particules pour former des arcs
      if (index % 3 === 0 && index < particlesRef.current.length - 1) {
        const nextParticle = particlesRef.current[index + 1]
        if (nextParticle.active) {
          const nextX = centerX + Math.cos(nextParticle.angle) * nextParticle.distance * (1 + audioLevel * 0.3)
          const nextY = centerY + Math.sin(nextParticle.angle) * nextParticle.distance * (1 + audioLevel * 0.3)
          
          ctx.beginPath()
          ctx.strokeStyle = particle.color.replace('0.8', (currentOpacity * 0.5).toString())
          ctx.lineWidth = 0.5
          ctx.moveTo(particle.x, particle.y)
          ctx.lineTo(nextX, nextY)
          ctx.stroke()
        }
      }
    })
  }
  
  // Fonction pour dessiner les reflets sur la sphère pour l'effet 3D
  const drawHighlights = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    sphereSize: number
  ): void => {
    // Reflet principal (en haut à gauche)
    const highlightGradient = ctx.createRadialGradient(
      centerX - sphereSize * 0.4, centerY - sphereSize * 0.4, 0,
      centerX - sphereSize * 0.4, centerY - sphereSize * 0.4, sphereSize * 0.6
    )
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.fillStyle = highlightGradient
    ctx.beginPath()
    ctx.arc(
      centerX - sphereSize * 0.4,
      centerY - sphereSize * 0.4,
      sphereSize * 0.4,
      0,
      Math.PI * 2
    )
    ctx.fill()
    
    // Petit reflet secondaire
    const smallHighlightGradient = ctx.createRadialGradient(
      centerX + sphereSize * 0.3, centerY + sphereSize * 0.3, 0,
      centerX + sphereSize * 0.3, centerY + sphereSize * 0.3, sphereSize * 0.2
    )
    smallHighlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
    smallHighlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.fillStyle = smallHighlightGradient
    ctx.beginPath()
    ctx.arc(
      centerX + sphereSize * 0.3,
      centerY + sphereSize * 0.3,
      sphereSize * 0.1,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }

  return <canvas ref={canvasRef} width={size} height={size} />
}

export default VoiceVisualizer
