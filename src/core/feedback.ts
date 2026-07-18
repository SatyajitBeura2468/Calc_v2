let audioContext: AudioContext | null = null

export function playKeySound() {
  const AudioContextConstructor = window.AudioContext
  audioContext ??= new AudioContextConstructor()
  const now = audioContext.currentTime
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(420, now)
  gain.gain.setValueAtTime(.018, now)
  gain.gain.exponentialRampToValueAtTime(.0001, now + .035)
  oscillator.connect(gain).connect(audioContext.destination)
  oscillator.start(now)
  oscillator.stop(now + .04)
}

export function tactileFeedback(sound: boolean, haptics: boolean) {
  if (haptics && 'vibrate' in navigator) navigator.vibrate(7)
  if (sound) playKeySound()
}
