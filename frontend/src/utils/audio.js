// Cache for audio objects to improve performance
const soundPath = '/music/awkward-moment.mp3';
let audioObj = null;

/**
 * Plays the specified sound effect
 * @param {string} type - The type of sound ('click', 'reward', etc.)
 * @param {boolean} enabled - Whether sound is enabled
 */
export const playSound = (type, enabled = true) => {
  if (!enabled) return;
  
  try {
    // Create audio object if it doesn't exist
    if (!audioObj) {
      audioObj = new Audio(soundPath);
      audioObj.load();
    }

    // Clone the node to allow overlapping sounds if needed, 
    // or just reset and play for simple cases
    const sound = audioObj.cloneNode();
    
    // Adjust volume based on sound type
    if (type === 'click') {
      sound.volume = 0.4;
    } else if (type === 'reward') {
      sound.volume = 0.7;
    } else {
      sound.volume = 0.5;
    }
    
    sound.play().catch(err => {
      // Browser often blocks audio until first user interaction
      console.debug("Audio play blocked or failed:", err.message);
    });
  } catch (e) {
    console.error("Error playing sound:", e);
  }
};
