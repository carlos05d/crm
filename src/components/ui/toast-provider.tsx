"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const ToastContext = React.createContext<{
    show: (msg: string, type?: "success" | "error" | "info") => void
}>({ show: () => { } })

export function useToast() {
    return React.useContext(ToastContext)
}

interface Toast {
    id: string
    message: string
    type: "success" | "error" | "info"
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([])

    const show = React.useCallback((message: string, type: "success" | "error" | "info" = "success") => {
        const id = Math.random().toString(36).slice(2)
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }, [])

    const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto flex items-start gap-3 rounded-xl border shadow-lg px-4 py-3 text-sm transition-all animate-in slide-in-from-bottom-5 fade-in-0",
                            toast.type === "success" && "bg-emerald-600 text-white border-emerald-500",
                            toast.type === "error" && "bg-red-600 text-white border-red-500",
                            toast.type === "info" && "bg-white text-slate-900 border-slate-200",
                        )}
                    >
                        <span className="text-lg leading-none">
                            {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
                        </span>
                        <p className="flex-1 font-medium">{toast.message}</p>
                        <button onClick={() => remove(toast.id)} className="opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
