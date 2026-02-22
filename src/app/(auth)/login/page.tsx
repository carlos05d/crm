"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError || !authData.user) {
            setError(authError?.message ?? "Invalid login credentials")
            setLoading(false)
            return
        }

        // Fetch role and redirect
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .single()

        const role = profile?.role
        if (role === "super_admin") {
            router.push("/sa/dashboard")
        } else if (role === "university_admin") {
            router.push("/u/dashboard")
        } else if (role === "agent") {
            router.push("/agent/dashboard")
        } else {
            setError("No role assigned to this account. Contact your administrator.")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex justify-center">
                    <div className="inline-flex items-center justify-center px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <span className="text-2xl font-extrabold tracking-tight text-[#1E3A8A]">
                            UniversityApp
                        </span>
                    </div>
                </div>

                <Card className="border-slate-200 shadow-lg rounded-2xl">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl font-bold text-slate-900">Welcome back</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">Enter your credentials to access your workspace</p>
                        {error && (
                            <div className="mt-3 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                                    Work Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@university.edu"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="h-11 border-slate-200 focus-visible:ring-blue-500"
                                    autoComplete="email"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                                        Password
                                    </Label>
                                    <a href="#" className="text-xs font-semibold text-[#1E3A8A] hover:underline">
                                        Forgot password?
                                    </a>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="h-11 border-slate-200 focus-visible:ring-blue-500"
                                    autoComplete="current-password"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold mt-2"
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
                                ) : (
                                    "Sign in to account"
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
                        <p className="text-xs text-slate-400 text-center">
                            Secured system for authorized personnel only.
                            <br />All access is logged and audited.
                        </p>
                    </CardFooter>
                </Card>

                {/* Quick-fill test account shortcuts for development */}
                {process.env.NODE_ENV === "development" && (
                    <Card className="border-dashed border-slate-200 bg-white/50">
                        <CardContent className="pt-4 pb-3">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
                                Dev Quick Login
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: "Super Admin", email: "super@test.com" },
                                    { label: "U Admin", email: "admin@test.com" },
                                    { label: "Agent", email: "agent@test.com" },
                                ].map(acc => (
                                    <button
                                        key={acc.email}
                                        type="button"
                                        onClick={() => { setEmail(acc.email); setPassword("Test1234!") }}
                                        className="text-xs py-2 px-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-700 transition-all font-medium"
                                    >
                                        {acc.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-[10px] text-slate-300 mt-2">
                                Password for all: Test1234!
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
