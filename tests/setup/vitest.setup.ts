/**
 * Vitest Setup File
 *
 * Global configuration and mocks for all tests.
 * This file runs before all test suites.
 */

import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup after each test to prevent memory leaks
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock window.location for navigation tests
const mockLocation = {
  href: 'http://localhost:8080/',
  origin: 'http://localhost:8080',
  protocol: 'http:',
  host: 'localhost:8080',
  hostname: 'localhost',
  port: '8080',
  pathname: '/',
  search: '',
  hash: '',
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock environment variables for Supabase
vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-123456789')

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
}
