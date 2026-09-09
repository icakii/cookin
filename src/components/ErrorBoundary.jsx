import React from "react";

// React unmounts the whole tree on an uncaught render error unless
// something catches it - without this, a bug in one page (e.g. the 3D
// avatar) blanks the entire app, header/nav included, instead of just that
// section. Class component because error boundaries have no hook form.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Caught by ErrorBoundary:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error);
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Something broke here. Try reloading the page.
        </div>
      );
    }
    return this.props.children;
  }
}
