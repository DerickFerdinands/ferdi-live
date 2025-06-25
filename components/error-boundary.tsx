"use client"

import { Component, type ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error("Error caught by boundary:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="h-5 w-5" />
                            Something went wrong
                        </CardTitle>
                        <CardDescription className="text-red-700">
                            An unexpected error occurred. Please try refreshing the page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Page
                        </Button>
                    </CardContent>
                </Card>
            )
        }

        return this.props.children
    }
}
