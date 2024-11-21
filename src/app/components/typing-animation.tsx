import Typed from "typed.js";
import React from "react";

export function TypingAnimation(): JSX.Element {
    const elementRef = React.useRef<HTMLSpanElement | null>(null);
    const typedRef = React.useRef<Typed | null>(null);

    React.useEffect(() => {
        const options = {
            strings: [
                "Welcome to^500 <strong>PaperCut</strong>^1000\nby ChatCut^500",
            ],
            typeSpeed: 50,
            backSpeed: 30,
            cursorChar: "|",
            loop: true, // Adds looping for continuous animation
        };

        typedRef.current = new Typed(elementRef.current, options);
        return () => {
            typedRef.current?.destroy();
        };
    }, []);

    return (
        <div
            className="relative flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-blue-200"
            aria-label="Typing animation showcasing PaperCut introduction"
        >
            <div className="text-center">
                <span
                    className="whitespace-pre text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500 drop-shadow-md"
                    ref={elementRef}
                />
                <div className="mt-4 text-gray-600 text-base sm:text-lg">
                    <p>Your AI assistant for creative text editing.</p>
                </div>
            </div>
        </div>
    );
}
