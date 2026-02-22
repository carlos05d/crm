"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
    return (
        <div className="space-y-6 font-sans">
            <div>
                <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Global Analytics</h2>
                <p className="text-slate-500 mt-1">Platform-wide statistics on lead generation, conversion rates, and volume.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-slate-200 h-96 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <BarChart3 className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Lead Volume History</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-2">
                        Chart component placeholder. Integration with Recharts or similar library required to paint historical data.
                    </p>
                </Card>

                <Card className="border-slate-200 h-96 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-blue-50 p-4 rounded-full mb-4 border border-blue-100">
                        <BarChart3 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Tenant Growth Rate</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-2">
                        Chart component placeholder. Observe MoM (Month-over-Month) tenant onboarding.
                    </p>
                </Card>
            </div>
        </div>
    )
}
