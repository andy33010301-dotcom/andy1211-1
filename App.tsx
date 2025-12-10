import React, { useState, useCallback } from 'react';
import { Radar, MapPinOff, Loader2 } from 'lucide-react';
import { AppState, Coordinates, Restaurant } from './types';
import { fetchNearbyRestaurants } from './services/geminiService';
import RadarView from './components/RadarView';
import RestaurantList from './components/RestaurantList';
import WinnerView from './components/WinnerView';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleStart = useCallback(() => {
    setState('LOCATING');
    
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      setState('ERROR');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setState('SCANNING');
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        try {
          const results = await fetchNearbyRestaurants(coords);
          // Simulate a bit of scanning time if API is too fast, for effect
          if (results.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setRestaurants(results);
            setState('RESULTS');
          } else {
             throw new Error("No results found.");
          }
        } catch (err: any) {
          console.error(err);
          // Show the actual error message if available, otherwise generic
          setErrorMsg(err.message || "Could not find restaurants. Please try again later.");
          setState('ERROR');
        }
      },
      (err) => {
        console.error(err);
        setErrorMsg("Please enable location access to find food nearby.");
        setState('ERROR');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  const handlePick = useCallback(() => {
    if (restaurants.length === 0) return;
    setState('PICKING');
    
    // Simulate a roulette effect
    let spinCount = 0;
    const maxSpins = 15; // Number of flickers before stopping
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * restaurants.length);
      setSelectedRestaurant(restaurants[randomIndex]);
      spinCount++;
      
      if (spinCount >= maxSpins) {
        clearInterval(interval);
        setState('WINNER');
      }
    }, 150);
    
  }, [restaurants]);

  const handleReset = () => {
    setState('IDLE');
    setRestaurants([]);
    setSelectedRestaurant(null);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-50 to-transparent pointer-events-none"></div>

      {/* Header */}
      <header className="p-6 text-center relative z-10">
        <div className="inline-flex items-center justify-center gap-2 text-emerald-600 mb-1">
          <Radar className="w-6 h-6" />
          <span className="font-bold tracking-wider text-xs uppercase">Location Locked</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 brand-font tracking-tight">
          Food<span className="text-emerald-500">Radar</span>
        </h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center w-full max-w-2xl mx-auto relative z-10">
        
        {state === 'IDLE' && (
          <div className="flex flex-col items-center justify-center flex-1 px-6 text-center animate-fade-in">
            <div className="w-48 h-48 bg-emerald-100 rounded-full flex items-center justify-center mb-8 relative group cursor-pointer transition-transform hover:scale-105" onClick={handleStart}>
              <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-20"></div>
              <div className="bg-white p-6 rounded-full shadow-xl">
                 <img src="https://cdn-icons-png.flaticon.com/512/3448/3448609.png" alt="Food Icon" className="w-20 h-20 object-contain" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Hungry but undecided?</h2>
            <p className="text-slate-500 max-w-xs mb-10 leading-relaxed">
              Enable your location and let our AI radar scan the best spots around you.
            </p>

            <button 
              onClick={handleStart}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-4 px-10 rounded-full shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center gap-2"
            >
              Start Scan
            </button>
          </div>
        )}

        {state === 'LOCATING' && (
           <div className="flex flex-col items-center justify-center flex-1">
             <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
             <p className="text-slate-600 font-medium">Acquiring GPS signal...</p>
           </div>
        )}

        {state === 'SCANNING' && (
          <div className="flex flex-col items-center justify-center flex-1 w-full animate-fade-in">
            <RadarView />
            <p className="text-slate-500 mt-8 text-center max-w-xs animate-pulse">
              Analyzing local reviews and cuisine types with Gemini AI...
            </p>
          </div>
        )}

        {state === 'RESULTS' && (
          <RestaurantList restaurants={restaurants} onSpin={handlePick} />
        )}

        {state === 'PICKING' && (
           <div className="flex flex-col items-center justify-center flex-1 w-full px-6 text-center">
             <h2 className="text-2xl font-bold text-slate-800 mb-8">Choosing the best spot...</h2>
             <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-100 p-8 transform scale-110 transition-all duration-150">
                {selectedRestaurant ? (
                    <>
                        <div className="text-5xl mb-4 text-center">🍽️</div>
                        <h3 className="text-2xl font-bold text-slate-800 truncate">{selectedRestaurant.name}</h3>
                        <p className="text-orange-500 font-medium uppercase mt-2">{selectedRestaurant.cuisine}</p>
                    </>
                ) : (
                    <div className="h-24 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
                    </div>
                )}
             </div>
           </div>
        )}

        {state === 'WINNER' && selectedRestaurant && (
          <WinnerView restaurant={selectedRestaurant} onReset={handleReset} />
        )}

        {state === 'ERROR' && (
          <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
              <MapPinOff size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Oops!</h3>
            <p className="text-slate-500 mb-8 max-w-xs break-words">{errorMsg}</p>
            <button 
              onClick={handleReset}
              className="bg-slate-900 text-white font-medium py-3 px-8 rounded-full hover:bg-slate-800"
            >
              Try Again
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-slate-300 text-xs z-10">
        <p>Powered by Gemini AI & Google Maps</p>
      </footer>
    </div>
  );
};

export default App;