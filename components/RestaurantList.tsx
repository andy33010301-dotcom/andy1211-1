import React from 'react';
import { Restaurant } from '../types';
import { MapPin, Utensils } from 'lucide-react';

interface RestaurantListProps {
  restaurants: Restaurant[];
  onSpin: () => void;
}

const RestaurantList: React.FC<RestaurantListProps> = ({ restaurants, onSpin }) => {
  return (
    <div className="w-full max-w-md mx-auto px-4 pb-20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 brand-font">Found {restaurants.length} Spots</h2>
        <p className="text-slate-500 text-sm">Here is what's nearby. Ready to choose?</p>
      </div>

      <div className="space-y-3">
        {restaurants.map((r) => (
          <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start gap-3 transition-transform hover:scale-[1.01]">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-orange-500">
              <Utensils size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 truncate">{r.name}</h3>
              <p className="text-xs text-orange-600 font-medium mb-1 uppercase tracking-wide">{r.cuisine}</p>
              <p className="text-slate-500 text-sm line-clamp-2">{r.description}</p>
            </div>
            {r.googleMapsUri && (
              <a 
                href={r.googleMapsUri} 
                target="_blank" 
                rel="noreferrer"
                className="text-slate-400 hover:text-emerald-600 transition-colors p-2"
              >
                <MapPin size={20} />
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-20">
        <button
          onClick={onSpin}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-12 rounded-full shadow-xl shadow-slate-900/20 transform transition active:scale-95 flex items-center gap-2 text-lg"
        >
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
          </span>
          PICK FOR ME
        </button>
      </div>
    </div>
  );
};

export default RestaurantList;
