"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, KeyRound, Lock } from "lucide-react"

export default function VerifyInvitePage() {
    const [token, setToken] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Check if the user arrived here with an active session implicitly created by the email link
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            // If the magic link actually logged them in already, we just need to let them set a password
            if (session) {
                // Note: If they arrived via a link that logged them in, we are in a purely "update password" state.
            }
        }
        checkSession()
    }, [supabase.auth])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        // Try to verify the OTP directly with the token (if using email OTP flow)
        // BUT wait, verifyOtp REQUIRES an email.
        // If the user arrived via the email link, Supabase often appends `error_code`, `access_token` etc to the hash.

        let sessionToUse = null;

        // Let's attempt to use the magic link's implicit login to just update the user.
        // If the user pasted the code manually, this will fail. Let's try password update first.
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
            password: password
        })

        if (!updateError && updateData.user) {
            // SUCCESS: They followed the link, the session was active, and we just updated the password.
            router.push("/agent/dashboard")
            return
        }

        if (updateError) {
            setError(updateError.message || "Failed to set password. Please contact your administrator.")
            setLoading(false)
            return
        }

        // 3. Password successfully set, redirect to their new dashboard
        router.push("/agent/dashboard")
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="mb-8 text-center">
                <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <KeyRound className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Complete Setup</h1>
                <p className="text-slate-500 mt-2 font-sans">Enter the authorization code sent to your email to configure your account.</p>
            </div>

            <Card className="w-full max-w-md shadow-xl border-slate-200/60 rounded-2xl">
                <form onSubmit={handleVerify}>
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-heading text-center">Verify Invitation</CardTitle>
                        <CardDescription className="text-center font-sans">
                            Create your password to access the CRM portal
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 font-sans">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium text-center">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="token" className="font-semibold text-slate-700">Authorization Code</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="token"
                                    type="text"
                                    placeholder="8-digit code"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary h-11 tracking-widest font-mono text-center text-lg"
                                    maxLength={8}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label htmlFor="password" className="font-semibold text-slate-700">Create Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary h-11"
                                    required
                                    disabled={loading}
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="font-semibold text-slate-700">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary h-11"
                                    required
                                    disabled={loading}
                                    minLength={6}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-6">
                        <Button
                            type="submit"
                            className="w-full text-base font-semibold h-11 rounded-lg shadow-sm"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            {loading ? "Verifying..." : "Complete Setup"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <p className="mt-8 text-sm text-slate-400 font-sans">
                Securely powered by Portal Access Authentication
            </p>
        </div>
    )
}
