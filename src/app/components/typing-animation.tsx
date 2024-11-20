import Typed from "typed.js"
import React from 'react';

export function TypingAnimation(): JSX.Element {

    const elementRef = React.useRef(null);
    const typedRef = React.useRef<Typed & { destroy: () => void } | null>(null);

    React.useEffect(() => {
        const options = {
            strings: [
                "Welcome to^500 <strong>PaperCut</strong>^1000\nby ChatCut^500"
            ],
            typeSpeed: 50,
            backSpeed: 30,
            cursorChar: "|"
        }

        typedRef.current = new Typed(elementRef.current, options)
        return () => {
            typedRef.current?.destroy();
        }
    }, [])

    return (
        <div className="pt-5 h-38">
            <span className="whitespace-pre text-2xl font-semibold text-blue-600" ref={elementRef} />
        </div>
    )
}