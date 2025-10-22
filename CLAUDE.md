# CLAUDE.md

This file provides comprehensive guidance to Claude Code when working with React/TypeScript code in this frontend repository.

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)

Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible. Simple solutions are easier to understand, maintain, and debug.

### YAGNI (You Aren't Gonna Need It)

Avoid building functionality on speculation. Implement features only when they are needed, not when you anticipate they might be useful in the future.

### Design Principles

- **Dependency Inversion**: High-level modules should not depend on low-level modules. Both should depend on abstractions.
- **Open/Closed Principle**: Software entities should be open for extension but closed for modification.
- **Single Responsibility**: Each function, class, and module should have one clear purpose.
- **Fail Fast**: Check for potential errors early and raise exceptions immediately when issues occur.

## 🧱 Code Structure & Modularity

### File and Function Limits

- **Never create a file longer than 500 lines of code**. If approaching this limit, refactor by splitting into modules.
- **React components should be under 200 lines** with a single, clear responsibility.
- **Custom hooks should be under 100 lines** and represent a single concept or entity.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
- **Line length should be max 100 characters** (configured in ESLint)
- **Use TypeScript strict mode** for better type safety and error prevention.

### Project Architecture

Follow React component-based architecture with clear separation of concerns:

```
src/
    components/           # Reusable UI components
        ui/              # shadcn/ui base components
        AudioPlayer.tsx  # Feature-specific components
        TranscriptionPanel.tsx
    pages/              # Route-level components
        Index.tsx
        NotFound.tsx
    hooks/              # Custom React hooks
        useWebSocket.ts
        useAudioTimestamp.ts
    services/           # Business logic and external integrations
        websocket.ts
        sttService.ts
        ttsService.ts
    contexts/           # React context providers
        AudioTimestampContext.tsx
    types/              # TypeScript type definitions
        message.ts
        index.ts
    lib/                # Utility functions
        utils.ts
    assets/             # Static assets
        images/
        audio/
```

**Component Organization Principles:**

- **Feature-based grouping**: Group related components together
- **Separation of concerns**: Keep UI, business logic, and data separate
- **Reusability**: Create reusable components in `components/ui/`
- **Type safety**: Define interfaces in `types/` directory
- **Custom hooks**: Extract component logic into reusable hooks

## 🛠️ Development Environment

### Node.js Package Management

This project uses npm for package management with Vite as the build tool.

```bash
# Install Node.js (if not already installed)
# Use nvm for Node.js version management
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts

# Install dependencies
npm install

# Add a package
npm install package-name

# Add development dependency
npm install --save-dev package-name

# Remove a package
npm uninstall package-name

# Run commands
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking (via TypeScript)
npx tsc --noEmit

# Format code (if Prettier is configured)
npx prettier --write .

# Run tests (when testing framework is added)
npm run test
npm run test:coverage
```

## 📋 Style & Conventions

### TypeScript & React Style Guide

- **Follow ESLint configuration** with TypeScript-specific rules
- **Line length**: 100 characters (configured in ESLint)
- **Use double quotes** for strings consistently
- **Always use type annotations** for function parameters and return types
- **Use interfaces** for object shapes and component props
- **Prefer functional components** with hooks over class components
- **Use const assertions** for immutable data structures

### React Component Patterns

```typescript
// ✅ Preferred: Functional component with TypeScript
interface AudioPlayerProps {
  src?: string;
  className?: string;
  onTranscriptionResult?: (result: STTResult) => void;
}

export const AudioPlayer = ({ src, className, onTranscriptionResult }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  return (
    <div className={cn("audio-player", className)}>
      {/* Component JSX */}
    </div>
  );
};

// ✅ Custom hook pattern
export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsServiceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    // Hook logic
  }, [url]);

  return { isConnected, sendMessage };
};
```

### Tailwind CSS Conventions

- **Use utility classes** for styling instead of custom CSS
- **Leverage shadcn/ui components** for consistent design system
- **Use CSS variables** for theme customization (defined in globals.css)
- **Mobile-first approach** with responsive design patterns
- **Use cn() utility** for conditional class names

```typescript
// ✅ Tailwind CSS patterns
<div className={cn(
  "flex items-center justify-center",
  "bg-gradient-surface rounded-lg shadow-elevated",
  "w-80 h-80 max-w-[85vw] max-h-[85vw]",
  isActive && "ring-2 ring-primary"
)}>
  {/* Content */}
</div>
```

### Documentation Standards

Use JSDoc comments for all public functions, components, and modules:

````typescript
/**
 * AudioPlayer Component
 *
 * A mobile-first audio player for the museum audio guide webapp.
 * Features:
 * - Audio playback controls (play, pause, skip)
 * - Voice transcription via Google Cloud STT
 * - Real-time audio timestamp tracking
 * - Press-and-hold microphone functionality
 *
 * @param props - Component props including audio source and event handlers
 * @returns JSX element for the audio player interface
 */
export const AudioPlayer = ({
  src,
  className,
  onTranscriptionResult,
}: AudioPlayerProps) => {
  // Component implementation
}

/**
 * Custom hook for WebSocket communication
 *
 * Provides connection state management and message handling for real-time
 * communication with the AI backend.
 *
 * @param url - WebSocket server URL
 * @returns Object containing connection state and message methods
 *
 * @example
 * ```typescript
 * const { isConnected, sendMessage, onMessage } = useWebSocket('ws://localhost:8080');
 * ```
 */
export const useWebSocket = (url: string) => {
  // Hook implementation
}
````

### Naming Conventions

- **Variables and functions**: `camelCase`
- **Components**: `PascalCase`
- **Interfaces and types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private methods/properties**: `_leadingUnderscore`
- **Custom hooks**: `use` prefix (e.g., `useWebSocket`)
- **Event handlers**: `handle` prefix (e.g., `handlePlay`)
- **Boolean variables**: `is`/`has`/`can` prefix (e.g., `isPlaying`, `hasError`)
- **CSS classes**: `kebab-case` for custom classes, Tailwind utilities as-is

## 🧪 Testing Strategy

### Test-Driven Development (TDD)

1. **Write the test first** - Define expected behavior before implementation
2. **Watch it fail** - Ensure the test actually tests something
3. **Write minimal code** - Just enough to make the test pass
4. **Refactor** - Improve code while keeping tests green
5. **Repeat** - One test at a time

### React Testing Best Practices

```typescript
// Always use React Testing Library for component testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioPlayer } from '@/components/AudioPlayer';

// Use descriptive test names
describe('AudioPlayer', () => {
  it('should play audio when play button is clicked', async () => {
    // Arrange
    const mockOnTranscriptionResult = jest.fn();
    render(<AudioPlayer onTranscriptionResult={mockOnTranscriptionResult} />);

    // Act
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  it('should handle transcription errors gracefully', () => {
    // Test error states and edge cases
  });
});

// Custom hook testing
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';

describe('useWebSocket', () => {
  it('should establish connection and provide sendMessage function', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));

    expect(result.current.isConnected).toBe(false);
    expect(typeof result.current.sendMessage).toBe('function');
  });
});
```

### Testing Organization

- **Unit tests**: Test individual components and hooks in isolation
- **Integration tests**: Test component interactions and data flow
- **End-to-end tests**: Test complete user workflows (when Cypress/Playwright is added)
- **Keep test files next to the code they test** (e.g., `AudioPlayer.test.tsx`)
- **Use `__tests__` directories** for complex test suites
- **Aim for 80%+ code coverage**, but focus on critical user paths

## 🚨 Error Handling

### Error Handling Best Practices

```typescript
// Create custom error classes for your domain
class AudioGuideError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AudioGuideError';
  }
}

class TranscriptionError extends AudioGuideError {
  constructor(message: string) {
    super(message, 'TRANSCRIPTION_ERROR');
  }
}

class WebSocketError extends AudioGuideError {
  constructor(message: string) {
    super(message, 'WEBSOCKET_ERROR');
  }
}

// Use specific error handling in components
const AudioPlayer = () => {
  const [error, setError] = useState<string | null>(null);

  const handleTranscriptionError = useCallback((error: Error) => {
    if (error instanceof TranscriptionError) {
      setError(`Transcription failed: ${error.message}`);
    } else {
      setError('An unexpected error occurred');
    }
  }, []);

  // Error boundary for component-level error handling
  if (error) {
    return (
      <div className="error-state">
        <p className="text-red-400">{error}</p>
        <button onClick={() => setError(null)}>Retry</button>
      </div>
    );
  }

  return <div>{/* Component JSX */}</div>;
};

// Custom hook with error handling
export const useWebSocket = (url: string) => {
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      // WebSocket connection logic
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      throw new WebSocketError(errorMessage);
    }
  }, [url]);

  return { error, connect };
};
```

### Logging Strategy

```typescript
// Use console methods appropriately for different environments
const logger = {
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data)
    }
  },
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data)
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data)
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error)
  },
}

// Usage in components
useEffect(() => {
  logger.debug('AudioPlayer mounted', { src })

  return () => {
    logger.debug('AudioPlayer unmounted')
  }
}, [src])
```

## 🔧 Configuration Management

### Environment Variables and Settings

```typescript
// Use Vite environment variables with type safety
interface AppConfig {
  apiUrl: string
  websocketUrl: string
  googleCloudApiKey: string
  elevenLabsApiKey: string
  isDevelopment: boolean
}

const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080',
  googleCloudApiKey: import.meta.env.VITE_GOOGLE_CLOUD_API_KEY || '',
  elevenLabsApiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
  isDevelopment: import.meta.env.DEV,
}

// Environment validation
const validateConfig = () => {
  const requiredVars = ['VITE_GOOGLE_CLOUD_API_KEY', 'VITE_ELEVENLABS_API_KEY']
  const missing = requiredVars.filter((key) => !import.meta.env[key])

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`)
  }
}

// Usage in components
export const useConfig = () => {
  useEffect(() => {
    validateConfig()
  }, [])

  return config
}
```

### Environment File Setup

Create `.env` files for different environments:

```bash
# .env.local (for local development)
VITE_API_URL=http://localhost:3000
VITE_WEBSOCKET_URL=ws://localhost:8080
VITE_GOOGLE_CLOUD_API_KEY=your_google_cloud_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key

# .env.production (for production)
VITE_API_URL=https://api.melior-audio-guide.com
VITE_WEBSOCKET_URL=wss://ws.melior-audio-guide.com
VITE_GOOGLE_CLOUD_API_KEY=production_key
VITE_ELEVENLABS_API_KEY=production_key
```

## 🏗️ Data Models and Validation

### TypeScript Interfaces and Zod Validation

```typescript
import { z } from 'zod'

// Define Zod schemas for runtime validation
const ChatMessageSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(1000),
  isUser: z.boolean(),
  timestamp: z.date(),
  audioTimestamp: z.number().optional(),
})

const EnhancedMessageSchema = z.object({
  text: z.string().min(1),
  timestamp: z.number(),
  messageType: z.literal('text'),
  metadata: z
    .object({
      audioPosition: z.number().optional(),
      formattedTimestamp: z.string().optional(),
      userId: z.string().optional(),
      sessionId: z.string().optional(),
    })
    .optional(),
})

// Infer TypeScript types from Zod schemas
export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type EnhancedMessage = z.infer<typeof EnhancedMessageSchema>

// Validation functions
export const validateChatMessage = (data: unknown): ChatMessage => {
  return ChatMessageSchema.parse(data)
}

export const validateEnhancedMessage = (data: unknown): EnhancedMessage => {
  return EnhancedMessageSchema.parse(data)
}

// Component props with validation
interface AudioPlayerProps {
  src?: string
  className?: string
  onTranscriptionResult?: (result: STTResult) => void
  config?: {
    volume?: number
    playbackRate?: number
    autoplay?: boolean
  }
}

// Service configuration with validation
const STTConfigSchema = z.object({
  apiKey: z.string().min(1),
  languageCode: z.string().default('fr-FR'),
  sampleRateHertz: z.number().default(16000),
  encoding: z
    .enum([
      'LINEAR16',
      'FLAC',
      'MULAW',
      'AMR',
      'AMR_WB',
      'OGG_OPUS',
      'SPEEX_WITH_HEADER_BYTE',
    ])
    .default('LINEAR16'),
  enableAutomaticPunctuation: z.boolean().default(true),
  enableWordTimeOffsets: z.boolean().default(false),
  enableWordConfidence: z.boolean().default(false),
  model: z.string().default('latest_long'),
})

export type STTConfig = z.infer<typeof STTConfigSchema>
```

## 🔄 Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `test/*` - Test additions or fixes

### Commit Message Format

Never include "claude code" or "written by claude code" in commit messages

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

Example:

```
feat(audio): add voice transcription functionality

- Implement Google Cloud STT integration
- Add press-and-hold microphone UI
- Update AudioPlayer component with transcription controls

Closes #123
```

## 📝 Documentation Standards

### Code Documentation

- Every module should have a JSDoc comment explaining its purpose
- Public functions and components must have complete JSDoc comments
- Complex logic should have inline comments with `// Reason:` prefix
- Keep README.md updated with setup instructions and examples
- Maintain CHANGELOG.md for version history

### Component Documentation

```typescript
/**
 * TranscriptionPanel Component
 *
 * A mobile-first chat interface for the audio guide museum webapp.
 * Features:
 * - Real-time chat with AI assistant
 * - Voice input transcription display
 * - Text-to-speech response integration
 * - Audio timestamp context for AI responses
 * - Draggable sheet interface for mobile UX
 *
 * @param props - Component props including connection status, message handlers, and UI state
 * @param ref - Ref to access component methods programmatically
 */
export const TranscriptionPanel = forwardRef<
  TranscriptionPanelRef,
  TranscriptionPanelProps
>(
  (
    {
      isVisible,
      className,
      onDragStart,
      isDragging,
      isConnected,
      connectionError,
      sendMessage,
    },
    ref,
  ) => {
    // Component implementation
  },
)
```

## 🚀 Performance Considerations

### React Optimization Guidelines

- **Profile before optimizing** - Use React DevTools Profiler
- **Use React.memo()** for expensive components that don't change often
- **Use useMemo() and useCallback()** for expensive computations and stable references
- **Implement code splitting** with React.lazy() and Suspense
- **Optimize bundle size** with tree shaking and dynamic imports
- **Use Web Workers** for CPU-intensive tasks
- **Implement virtual scrolling** for large lists
- **Cache API responses** with React Query or SWR

### Example Optimizations

```typescript
// ✅ Memoized component
const AudioPlayer = React.memo(({ src, onTranscriptionResult }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // ✅ Memoized expensive calculation
  const audioConfig = useMemo(() => ({
    volume: 0.8,
    playbackRate: 1.0,
    autoplay: false,
  }), []);

  // ✅ Memoized callback
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
});

// ✅ Code splitting
const TranscriptionPanel = React.lazy(() => import('./TranscriptionPanel'));

// ✅ Suspense wrapper
const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <TranscriptionPanel />
  </Suspense>
);

// ✅ Custom hook with caching
export const useAudioData = (audioId: string) => {
  return useQuery({
    queryKey: ['audio', audioId],
    queryFn: () => fetchAudioData(audioId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### Bundle Optimization

```typescript
// ✅ Dynamic imports for route-based code splitting
const routes = [
  {
    path: '/',
    component: React.lazy(() => import('./pages/Index')),
  },
  {
    path: '/audio/:id',
    component: React.lazy(() => import('./pages/AudioDetail')),
  },
]

// ✅ Tree shaking friendly imports
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ❌ Avoid importing entire libraries
import * as _ from 'lodash' // Don't do this
import { debounce } from 'lodash' // Do this instead
```

## 🛡️ Security Best Practices

### Frontend Security Guidelines

- **Never commit API keys** - Use environment variables with VITE\_ prefix
- **Validate all user input** with Zod schemas before processing
- **Sanitize HTML content** to prevent XSS attacks
- **Use HTTPS** for all external communications
- **Implement Content Security Policy (CSP)** headers
- **Keep dependencies updated** with `npm audit` and `npm update`
- **Use secure WebSocket connections** (WSS) in production
- **Implement proper CORS** configuration

### Example Security Implementation

```typescript
// ✅ Environment variable validation
const validateEnvironment = () => {
  const requiredVars = [
    'VITE_GOOGLE_CLOUD_API_KEY',
    'VITE_ELEVENLABS_API_KEY',
    'VITE_WEBSOCKET_URL',
  ]

  const missing = requiredVars.filter((key) => !import.meta.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    )
  }
}

// ✅ Input sanitization
import DOMPurify from 'dompurify'

const sanitizeUserInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

// ✅ Secure WebSocket connection
const createSecureWebSocket = (url: string): WebSocket => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const secureUrl = url.replace(/^ws:/, protocol)
  return new WebSocket(secureUrl)
}

// ✅ API key protection
const getApiKey = (service: 'google' | 'elevenlabs'): string => {
  const key =
    service === 'google'
      ? import.meta.env.VITE_GOOGLE_CLOUD_API_KEY
      : import.meta.env.VITE_ELEVENLABS_API_KEY

  if (!key) {
    throw new Error(`API key for ${service} not found`)
  }

  return key
}
```

### Content Security Policy

```html
<!-- Add to index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' wss: https:;
  media-src 'self' blob:;
"
/>
```

## 🔍 Debugging Tools

### Frontend Debugging Commands

```bash
# Install debugging tools
npm install --save-dev @types/node

# Run development server with debugging
npm run dev

# Build with source maps for debugging
npm run build

# Run linting with detailed output
npm run lint -- --debug

# Type checking with detailed output
npx tsc --noEmit --listFiles

# Bundle analysis
npx vite-bundle-analyzer dist
```

### React Debugging Tools

```typescript
// ✅ React DevTools integration
import { Profiler } from 'react';

const onRenderCallback = (id: string, phase: string, actualDuration: number) => {
  console.log('Component:', id, 'Phase:', phase, 'Duration:', actualDuration);
};

<Profiler id="AudioPlayer" onRender={onRenderCallback}>
  <AudioPlayer />
</Profiler>

// ✅ Custom debugging hook
export const useDebugRender = (componentName: string) => {
  useEffect(() => {
    console.log(`${componentName} rendered`);
    return () => console.log(`${componentName} unmounted`);
  });
};

// ✅ Error boundary for debugging
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}
```

### Browser DevTools Integration

```typescript
// ✅ Console debugging helpers
const debug = {
  log: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${message}`, data)
    }
  },
  time: (label: string) => {
    if (import.meta.env.DEV) {
      console.time(label)
    }
  },
  timeEnd: (label: string) => {
    if (import.meta.env.DEV) {
      console.timeEnd(label)
    }
  },
}

// Usage in components
useEffect(() => {
  debug.time('AudioPlayer mount')
  // Component logic
  debug.timeEnd('AudioPlayer mount')
}, [])
```

## 📊 Monitoring and Observability

### Frontend Monitoring

```typescript
// ✅ Structured logging for frontend
const logger = {
  info: (message: string, metadata?: Record<string, any>) => {
    console.info(`[INFO] ${message}`, metadata)
  },
  warn: (message: string, metadata?: Record<string, any>) => {
    console.warn(`[WARN] ${message}`, metadata)
  },
  error: (message: string, error?: Error, metadata?: Record<string, any>) => {
    console.error(`[ERROR] ${message}`, error, metadata)
  },
  performance: (label: string, duration: number) => {
    console.log(`[PERF] ${label}: ${duration}ms`)
  },
}

// ✅ Performance monitoring
export const usePerformanceMonitor = () => {
  const measureRender = useCallback((componentName: string) => {
    const start = performance.now()
    return () => {
      const end = performance.now()
      logger.performance(`${componentName} render`, end - start)
    }
  }, [])

  return { measureRender }
}

// ✅ Error tracking
export const trackError = (error: Error, context?: Record<string, any>) => {
  logger.error('Application error', error, {
    ...context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  })
}
```

## 📚 Useful Resources

### Essential Tools

- **Vite Documentation**: https://vitejs.dev/
- **React Documentation**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/
- **shadcn/ui**: https://ui.shadcn.com/
- **Zod Validation**: https://zod.dev/

### React Best Practices

- **React Patterns**: https://reactpatterns.com/
- **React TypeScript Cheatsheet**: https://react-typescript-cheatsheet.netlify.app/
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **React DevTools**: https://react.dev/learn/react-developer-tools

## ⚠️ Important Notes

- **NEVER ASSUME OR GUESS** - When in doubt, ask for clarification
- **Always verify file paths and component names** before use
- **Keep CLAUDE.md updated** when adding new patterns or dependencies
- **Test your components** - No feature is complete without tests
- **Document your decisions** - Future developers (including yourself) will thank you
- **Mobile-first design** - Always consider mobile users in museum environments
- **Performance matters** - Optimize for low latency and smooth audio playback

## 🔍 Search Command Requirements

**CRITICAL**: Always use `rg` (ripgrep) instead of traditional `grep` and `find` commands:

```bash
# ❌ Don't use grep
grep -r "pattern" .

# ✅ Use rg instead
rg "pattern"

# ❌ Don't use find with name
find . -name "*.tsx"

# ✅ Use rg with file filtering
rg --files | rg "\.tsx$"
# or
rg --files -g "*.tsx"
```

**Enforcement Rules:**

```
(
    r"^grep\b(?!.*\|)",
    "Use 'rg' (ripgrep) instead of 'grep' for better performance and features",
),
(
    r"^find\s+\S+\s+-name\b",
    "Use 'rg --files | rg pattern' or 'rg --files -g pattern' instead of 'find -name' for better performance",
),
```

## 🚀 GitHub Flow Workflow Summary

main (protected) ←── PR ←── feature/your-feature
↓ ↑
deploy development

### Daily Workflow:

1. git checkout main && git pull origin main
2. git checkout -b feature/new-feature
3. Make changes + tests
4. git push origin feature/new-feature
5. Create PR → Review → Merge to main

---

_This document is a living guide. Update it as the project evolves and new patterns emerge._
