'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  section?: string
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const section = this.props.section ?? 'unknown'
    console.error(`[ErrorBoundary] Section "${section}" crashed:`, error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-lg text-red-800"
        >
          <span aria-hidden="true" className="text-2xl">⚠</span>
          <span>
            {this.props.section
              ? `The ${this.props.section} section encountered an error. Please refresh the page.`
              : 'This section encountered an error. Please refresh the page.'}
          </span>
        </div>
      )
    }
    return this.props.children
  }
}
