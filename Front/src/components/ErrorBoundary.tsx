import { Component, ReactNode } from "react";

type State = { error: Error | null };

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#2a0f0f",
          color: "#ffd7d7",
          padding: 24,
          margin: 24,
          border: "1px solid #7a2b2b",
          borderRadius: 12,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        <strong style={{ fontSize: 16 }}>
          ⚠️ L'application a planté pendant l'affichage
        </strong>
        <br />
        <br />
        {error.message}
        {error.stack ? "\n\n" + error.stack : ""}
      </div>
    );
  }
}
