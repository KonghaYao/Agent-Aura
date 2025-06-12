"use client";

import { motion } from "motion/react";

export default function AnimatedBackground() {
    const bigSize = 2;
    const smallSize = 1;
    return (
        <div className="fixed inset-0 -z-10 flex items-center justify-center overflow-hidden">
            <motion.div
                className="relative h-72 w-72 md:h-96 md:w-96 lg:w-[32rem] lg:h-[32rem] -translate-y-16"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 10,
                    ease: "linear",
                    repeat: Infinity,
                }}
            >
                {/* Ball B (the one being chased, further ahead) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                        className="h-48 w-48 rounded-full bg-pink-400 opacity-25 blur-3xl md:h-60 md:w-60"
                        animate={{
                            scale: [smallSize, bigSize, smallSize],
                        }}
                        transition={{
                            duration: 5,
                            ease: "easeInOut",
                            repeat: Infinity,
                            repeatType: "mirror",
                        }}
                    />
                </div>

                {/* Ball A (the chaser, slightly behind) */}
                <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                        className="h-44 w-44 rounded-full bg-blue-400 opacity-25 blur-3xl md:h-52 md:w-52"
                        animate={{
                            scale: [smallSize, bigSize, smallSize],
                        }}
                        transition={{
                            duration: 5,
                            ease: "easeInOut",
                            repeat: Infinity,
                            repeatType: "mirror",
                        }}
                    />
                </div>
            </motion.div>
        </div>
    );
}
