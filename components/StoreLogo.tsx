import React from 'react';

export const StoreLogo: React.FC = () => {
  return (
    <div className="flex justify-center items-end gap-1 select-none pointer-events-none pb-2">
      {/* Container for the logo graphic */}
      <div className="relative w-[52px] h-[64px] flex items-center justify-center mb-0.5">
        {/* Apple Shape (White Base) */}
        <svg viewBox="0 0 384 512" className="w-full h-full fill-white drop-shadow-sm">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 79.9c14.2 40.2 40.8 81.7 70.4 83.4 20.9 1.2 27.6-14 62-14 30.5-1 43.2 15.5 62.6 15.1 24.5-.4 48-26.6 63.8-56.1 11.1-23.2 14.7-44.7 14.7-45.1-.3-.6-33.8-12.2-33.2-68zM245.4 79c13.2-18.5 25.1-45.7 19.3-79-22.3 2.1-48.4 15.7-65.4 39.9-13.8 19.3-25.2 45.4-18.3 77.2 25.2 2 51.3-19.7 64.4-38.1z"/>
        </svg>
        
        {/* Gear Overlay - Matches background color (#b599d6) to create "Cutout" effect */}
        {/* The center hole of the gear is transparent, revealing the white apple underneath */}
        <div className="absolute top-[55%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[24px] h-[24px]">
             <svg viewBox="0 0 512 512" className="w-full h-full fill-[#b599d6]">
                <path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.4-36.7-6.5-74.3-6.5-111 0-5.5 .9-9.4 5.8-9.4 11.4v49.1c-22.3 7.8-42.9 19.8-60.8 35.1L87.5 85.3c-4.8-2.8-11-1.8-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4 .6 11.2 5.5 14L66.1 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.1c0 5.6 3.9 10.5 9.4 11.4 36.7 6.5 74.3 6.5 111 0 5.5-.9 9.4-5.8 9.4-11.4v-49.1c22.3-7.8 42.9-19.8 60.8-35.1l42.6 24.6c4.8 2.8 11 1.8 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"/>
             </svg>
        </div>
      </div>
      
      {/* Text Label - Large and Thin */}
      <div className="flex items-start h-[56px] relative">
        <span className="text-white text-[4.2rem] font-light tracking-wide leading-none font-roboto -ml-1">
          iStore
        </span>
        <span className="text-white text-[12px] mt-2.5 ml-1 font-bold">®</span>
      </div>
    </div>
  );
};