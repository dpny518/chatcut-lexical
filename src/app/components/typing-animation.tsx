import React, { useRef, useEffect } from "react";
import Typed from "typed.js";
import { motion } from "framer-motion";
import { Sparkles, Zap, ArrowDown } from "lucide-react";

export function TypingAnimation(): JSX.Element {
    const editorRef = useRef<HTMLDivElement>(null);
    const elementRef = useRef<HTMLSpanElement | null>(null);
    const typedRef = useRef<Typed | null>(null);

    const handleLearnMore = () => {
        window.open('https://chatcut.io', '_blank');
    };

    const handleGetStarted = () => {
        // Scroll to the transcript-editor div
        const editorContainer = document.querySelector('.transcript-editor');
        editorContainer?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start' 
        });
    };

    useEffect(() => {
        const options = {
            strings: [
                "Welcome to ^500<strong>ChatCut</strong>^1000",
                "AI-Powered ^500<strong>Transcript Editing</strong>^1000",
                "Creativity ^500<strong>Unleashed</strong>^1000"
            ],
            typeSpeed: 50,
            backSpeed: 30,
            backDelay: 2000,
            cursorChar: "▊",
            loop: true,
        };

        typedRef.current = new Typed(elementRef.current, options);
        return () => {
            typedRef.current?.destroy();
        };
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative flex justify-center items-center min-h-screen bg-gradient-to-br from-[#FFF7E6] to-[#FFE9D6] overflow-hidden"
            aria-label="ChatCut Introduction"
        >
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                        opacity: [0, 1, 0.5, 1], 
                        scale: [0.5, 1, 0.9, 1] 
                    }}
                    transition={{ 
                        duration: 5, 
                        repeat: Infinity, 
                        repeatType: "reverse" 
                    }}
                    className="absolute top-10 right-10 text-[#F4B69A]"
                >
                    <Sparkles size={100} />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                        opacity: [0, 1, 0.5, 1], 
                        scale: [0.5, 1, 0.9, 1] 
                    }}
                    transition={{ 
                        duration: 5, 
                        repeat: Infinity, 
                        repeatType: "reverse",
                        delay: 2.5
                    }}
                    className="absolute bottom-10 left-10 text-[#E69A76]"
                >
                    <Zap size={100} />
                </motion.div>
            </div>

            <div className="text-center relative z-10 p-6">
                <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="block mb-4 text-sm text-gray-600 uppercase tracking-wider"
                >
                    Introducing
                </motion.span>

                <span
                    ref={elementRef}
                    className="block whitespace-pre text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#E76E4B] to-[#F59A6E] drop-shadow-md min-h-[100px]"
                />

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-6 text-gray-700 text-lg sm:text-xl max-w-2xl mx-auto"
                >
                    <p>Streamline your documentary production with AI-powered transcript editing.</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-8 flex justify-center space-x-4"
                >
                    <button 
                        onClick={handleLearnMore}
                        className="px-6 py-3 bg-white border border-black text-black rounded-full hover:bg-gray-100 transition-all flex items-center space-x-2 shadow-md"
                    >
                        <Sparkles size={20} />
                        <span>Learn More</span>
                    </button>
                    <button 
                        onClick={handleGetStarted}
                        className="px-6 py-3 bg-[#E76E4B] text-white rounded-full hover:bg-[#D75D39] transition-all shadow-lg flex items-center space-x-2"
                    >
                        <ArrowDown size={20} />
                        <span>Get Started</span>
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="mt-12"
                >
                    <motion.div
                        animate={{ 
                            y: [0, -10, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "loop"
                        }}
                    >
                        <ArrowDown 
                            size={32} 
                            className="mx-auto text-[#E76E4B] animate-bounce" 
                        />
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
}

export default TypingAnimation;
