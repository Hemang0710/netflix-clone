import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// jsdom lacks TextEncoder/TextDecoder, which pg (via @prisma/adapter-pg) needs
global.TextEncoder = global.TextEncoder || TextEncoder
global.TextDecoder = global.TextDecoder || TextDecoder

// structuredClone exists in Node but jsdom's global scope hides it
if (!global.structuredClone) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const v8 = require('node:v8')
  global.structuredClone = (val) => v8.deserialize(v8.serialize(val))
}

// Web streams (needed by the edge runtime primitives below)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const streamWeb = require('stream/web')
for (const name of [
  'ReadableStream',
  'WritableStream',
  'TransformStream',
  'TextEncoderStream',
  'TextDecoderStream',
  'CompressionStream',
  'DecompressionStream',
]) {
  if (!global[name] && streamWeb[name]) global[name] = streamWeb[name]
}

// jsdom also lacks the fetch primitives (Request/Response/Headers) that
// next/server route handlers depend on — use Next's bundled edge runtime ones
// eslint-disable-next-line @typescript-eslint/no-require-imports
const edge = require('next/dist/compiled/@edge-runtime/primitives')
global.Request = global.Request || edge.Request
global.Response = global.Response || edge.Response
global.Headers = global.Headers || edge.Headers
global.fetch = global.fetch || edge.fetch
global.FormData = global.FormData || edge.FormData
global.Blob = global.Blob || edge.Blob

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))
