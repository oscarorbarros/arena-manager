"use client";
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NewsSliderProps {
    images: string[];
}

export function NewsSlider({ images }: NewsSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % images.length);
        }, 4000); // Change image every 4 seconds
        return () => clearInterval(interval);
    }, [images.length]);

    if (!images || images.length === 0) return null;

    if (images.length === 1) {
        return (
            <div className="absolute inset-0 w-full h-full">
                <img src={images[0]} alt="News" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full group relative overflow-hidden">
            {images.map((img, idx) => (
                <div 
                    key={idx}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    <img src={img} alt={`Slide ${idx}`} className="w-full h-full object-cover" />
                </div>
            ))}
            
            <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2">
                {images.map((_, idx) => (
                    <button 
                        key={idx} 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex(idx); }}
                        className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-[#059669]' : 'bg-white/50 hover:bg-white'} border border-black/20`}
                    />
                ))}
            </div>

            <button 
                onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    setCurrentIndex(prev => (prev - 1 + images.length) % images.length); 
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#059669]"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
                onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    setCurrentIndex(prev => (prev + 1) % images.length); 
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#059669]"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
}

