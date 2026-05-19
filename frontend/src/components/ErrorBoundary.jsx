import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#721c24', background: '#f8d7da', fontFamily: 'monospace' }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
