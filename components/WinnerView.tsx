import React, { useEffect } from 'react';
import { Restaurant } from '../types';
import { MapPin, RotateCcw, Star, Navigation } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WinnerViewProps {
  restaurant: Restaurant;
  onReset: () => void;
}

const WinnerView: React.FC<WinnerViewProps> = ({ restaurant, onReset }) => {
  
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10B981', '#F59E0B', '#F43F5E']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10B981', '#F59E0B', '#F43F5E']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 max-w-md mx-auto text-center animate-fade-in-up">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
        <div className="bg-white p-6 rounded-full shadow-xl border-4 border-yellow-100 relative z-10">
          <Star size={48} className="text-yellow-500 fill-yellow-500" />
        </div>
      </div>
      
      <h2 className="text-slate-400 font-medium uppercase tracking-wider text-sm mb-2">We found your match!</h2>
      <h1 className="text-4xl font-extrabold text-slate-900 mb-4 brand-font leading-tight">{restaurant.name}</h1>
      
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 w-full mb-8">
        <div className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-bold mb-4">
          {restaurant.cuisine}
        </div>
        <p className="text-slate-600 leading-relaxed mb-6">
          {restaurant.description}
        </p>
        
        {restaurant.googleMapsUri ? (
             <a 
             href={restaurant.googleMapsUri}
             target="_blank"
             rel="noreferrer"
             className="flex items-center justify-center w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors gap-2"
           >
             <Navigation size={20} />
             Get Directions
           </a>
        ) : (
            <div className="text-slate-400 text-sm italic">Map link unavailable</div>
        )}
      </div>

      <button 
        onClick={onReset}
        className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-2 transition-colors py-3"
      >
        <RotateCcw size={18} />
        Scan Again
      </button>
    </div>
  );
};

export default WinnerView;
