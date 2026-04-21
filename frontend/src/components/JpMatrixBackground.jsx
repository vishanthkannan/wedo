import React, { useState, useEffect } from 'react';

const symbols = ['+', '−', '×', '÷', '=', '≠', '≈', '∞', '√', '∑', '∏', '∫', '∂', '∆', 'π', 'θ', 'λ', 'μ', 'σ', 'ω', 'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'ι', 'κ', 'ν', 'ξ', 'ρ', 'τ', 'φ', 'χ', 'ψ', '∈', '∉', '∩', '∪', '⊂', '⊃', '⊆', '⊇', '∧', '∨', '¬', '⇒', '⇔', '∀', '∃', 'ℕ', 'ℤ', 'ℚ', 'ℝ', 'ℂ', '|', '∥', '∠', '⊥', '≅', '∝', '∴', '∵', '⊕', '⊗', '⊥', '⊢', '⊨', '∇'];

const JpMatrixBackground = () => {
  const [numSymbols, setNumSymbols] = useState(2000);

  useEffect(() => {
    const calculateSymbols = () => {
      // grid cell is 40x40
      // Use screen dimensions instead of window to ensure it always covers max potential size
      // Add a generous buffer multiplier just in case
      const cols = Math.ceil((window.screen.width * 1.5) / 40);
      const rows = Math.ceil((window.screen.height * 1.5) / 40);
      setNumSymbols(cols * rows);
    };

    calculateSymbols();
    window.addEventListener('resize', calculateSymbols);
    return () => window.removeEventListener('resize', calculateSymbols);
  }, []);

  return (
    <div className="jp-matrix">
      {Array.from({ length: numSymbols }).map((_, i) => (
        <span key={i}>{symbols[i % symbols.length]}</span>
      ))}
    </div>
  );
};

export default JpMatrixBackground;
