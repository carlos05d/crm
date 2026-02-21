import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function LoginPage() {
    return (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="mb-6 flex justify-center text-center">
                <div className="inline-flex items-center justify-center p-3 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
                    <span className="text-3xl font-extrabold tracking-tight text-[#1E3A8A]">
                        🏛️ University CRM
                    </span>
                </div>
            </div>

            <Card className="border-[#E5E7EB] shadow-sm rounded-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-center text-slate-900">
                        Sign in to your account
                    </CardTitle>
                    <CardDescription className="text-center text-slate-500">
                        Enter your email below to securely access the platform
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" action="#">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@university.edu"
                                className="border-[#E5E7EB] focus-visible:ring-[#3B82F6] rounded-md"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                                <Link href="#" className="text-sm font-medium text-[#1E3A8A] hover:text-[#3B82F6] hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                className="border-[#E5E7EB] focus-visible:ring-[#3B82F6] rounded-md"
                                required
                            />
                        </div>

                        <Button className="w-full bg-[#1E3A8A] hover:bg-[#14532D] text-white font-medium rounded-lg transition-colors py-2.5 mt-2">
                            Sign In
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-[#E5E7EB] pt-4 mt-2">
                    <p className="text-xs text-slate-400 text-center">
                        Secured system for authorized personnel only. <br />
                        All access is logged and audited.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
