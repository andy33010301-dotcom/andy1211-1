import React from 'react';

const RadarView: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center w-64 h-64 md:w-80 md:h-80 mx-auto my-8">
      {/* Outer Circles */}
      <div className="absolute inset-0 border-4 border-emerald-100 rounded-full opacity-30"></div>
      <div className="absolute inset-4 border-2 border-emerald-200 rounded-full opacity-40"></div>
      <div className="absolute inset-12 border border-emerald-300 rounded-full opacity-50"></div>
      
      {/* Pulse Effect */}
      <div className="absolute w-full h-full bg-emerald-400 rounded-full opacity-20 pulse-ring"></div>
      
      {/* Scanner Sweep */}
      <div className="absolute w-full h-full rounded-full overflow-hidden radar-sweep origin-center">
        <div className="w-1/2 h-1/2 bg-gradient-to-br from-transparent to-emerald-500/40 absolute top-0 left-1/2 origin-bottom-left" style={{ transform: 'skewY(-10deg)' }}></div>
      </div>

      {/* Center Dot */}
      <div className="relative z-10 w-4 h-4 bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/50"></div>
      
      {/* Blips */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
      <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-emerald-500 rounded-full animate-ping delay-700 opacity-75"></div>
      <div className="absolute top-2/3 left-1/4 w-2 h-2 bg-emerald-500 rounded-full animate-ping delay-300 opacity-75"></div>

      <p className="absolute -bottom-16 text-emerald-700 font-semibold animate-pulse tracking-widest text-sm uppercase">
        Scanning Area...
      </p>
    </div>
  );
};

export default RadarView;
