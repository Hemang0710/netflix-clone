import {
  buildConceptsCsv,
  buildExportFiles,
  csvEscape,
  sanitizeFileName,
} from '@/lib/exporter'
import { buildZip, crc32 } from '@/lib/zip'

const NOW = new Date('2026-07-17T12:00:00Z')

const sampleData = {
  concepts: [
    {
      id: 1,
      concept: 'Recursion',
      masteryScore: 85,
      interval: 12,
      reviewCount: 6,
      repetitions: 6,
      lastReviewAt: NOW,
      createdAt: NOW,
      dueDate: new Date('2026-07-29T00:00:00Z'),
      source: 'chapter',
      content: { id: 10, title: 'Algorithms 101' },
      inboxItem: null,
    },
    {
      id: 2,
      concept: 'C++: Templates/Generics?',
      masteryScore: 30,
      interval: 1,
      reviewCount: 1,
      repetitions: 1,
      lastReviewAt: NOW,
      createdAt: NOW,
      dueDate: new Date('2026-07-18T00:00:00Z'),
      source: 'inbox',
      content: null,
      inboxItem: { id: 20, title: 'A great article' },
    },
  ],
  notes: [
    {
      id: 1, contentId: 10, timestamp: 65, body: 'Base case first',
      createdAt: NOW, content: { id: 10, title: 'Algorithms 101' },
    },
  ],
  highlights: [
    {
      id: 1, contentId: 10, text: 'Divide and conquer', summary: 'The core idea',
      createdAt: NOW, content: { id: 10, title: 'Algorithms 101' },
    },
  ],
  inboxItems: [
    {
      id: 20, title: 'A great article', sourceType: 'article',
      url: 'https://example.com/post', summary: 'Summary here', createdAt: NOW,
    },
  ],
  teachBackSessions: [
    {
      id: 1, conceptMasteryId: 1, concept: 'Recursion', audience: 'beginner',
      explanation: 'It calls itself until a base case.', score: 78,
      feedback: 'Explain the stack too.', createdAt: NOW,
    },
  ],
  projectBriefs: [
    {
      id: 1, title: 'Build a JSON parser', pitch: 'Prove the cluster.',
      deliverable: 'A working parser', difficulty: 'starter', status: 'completed',
      createdAt: NOW, completedAt: NOW,
      checkpoints: [
        { id: 1, order: 1, title: 'Tokenizer', task: 'Write it', status: 'passed', submission: 'I wrote a tokenizer' },
        { id: 2, order: 2, title: 'Parser', task: 'Write it too', status: 'passed', submission: 'Done' },
      ],
    },
  ],
}

describe('sanitizeFileName / csvEscape', () => {
  it('strips path and wikilink breakers', () => {
    expect(sanitizeFileName('C++: Templates/Generics?')).toBe('C++ Templates Generics')
    expect(sanitizeFileName('a[b]#c|d"e')).toBe('a b c d e')
    expect(sanitizeFileName('   ')).toBe('Untitled')
  })

  it('escapes CSV fields with commas, quotes, newlines', () => {
    expect(csvEscape('plain')).toBe('plain')
    expect(csvEscape('a,b')).toBe('"a,b"')
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""')
    expect(csvEscape('line\nbreak')).toBe('"line\nbreak"')
  })
})

describe('buildExportFiles (obsidian flavor)', () => {
  const files = buildExportFiles(sampleData, { flavor: 'obsidian', now: NOW })
  const byPath = Object.fromEntries(files.map((f) => [f.path, f.content]))

  it('creates one note per concept, source, capture, and project plus an index', () => {
    expect(Object.keys(byPath)).toEqual(
      expect.arrayContaining([
        'Concepts/Recursion.md',
        'Concepts/C++ Templates Generics.md',
        'Sources/Algorithms 101.md',
        'Inbox/A great article.md',
        'Projects/Build a JSON parser.md',
        'LearnAI Index.md',
      ])
    )
  })

  it('writes YAML frontmatter with mastery and retention', () => {
    const note = byPath['Concepts/Recursion.md']
    expect(note).toMatch(/^---\n/)
    expect(note).toContain('mastery: 85')
    expect(note).toContain('status: mastered')
    expect(note).toContain('due: 2026-07-29')
  })

  it('links concepts to sources with wikilinks', () => {
    expect(byPath['Concepts/Recursion.md']).toContain('[[Algorithms 101]]')
    expect(byPath['Sources/Algorithms 101.md']).toContain('[[Recursion]]')
    expect(byPath['Concepts/C++ Templates Generics.md']).toContain('[[A great article]]')
  })

  it('includes teach-back history, highlights, notes, and checkpoints', () => {
    expect(byPath['Concepts/Recursion.md']).toContain('scored 78/100')
    expect(byPath['Sources/Algorithms 101.md']).toContain('> Divide and conquer')
    expect(byPath['Sources/Algorithms 101.md']).toContain('Base case first')
    expect(byPath['Projects/Build a JSON parser.md']).toContain('- [x] **Tokenizer**')
  })

  it('does not include the Notion CSV', () => {
    expect(byPath['concepts.csv']).toBeUndefined()
  })
})

describe('buildExportFiles (notion flavor)', () => {
  const files = buildExportFiles(sampleData, { flavor: 'notion', now: NOW })
  const byPath = Object.fromEntries(files.map((f) => [f.path, f.content]))

  it('uses plain markdown links instead of wikilinks', () => {
    expect(byPath['Concepts/Recursion.md']).not.toContain('[[')
    expect(byPath['Concepts/Recursion.md']).toContain('](Sources/Algorithms%20101.md)')
  })

  it('includes an importable concepts.csv', () => {
    const csv = byPath['concepts.csv']
    expect(csv.split('\r\n')[0]).toContain('Name,Mastery,Status')
    expect(csv).toContain('Recursion,85,mastered')
    expect(csv).toContain('C++: Templates/Generics?')
  })
})

describe('buildConceptsCsv', () => {
  it('handles empty input', () => {
    const csv = buildConceptsCsv([], NOW)
    expect(csv.split('\r\n')[0]).toContain('Name')
  })
})

describe('zip writer', () => {
  it('computes the standard CRC-32 check value', () => {
    expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926)
  })

  it('produces a structurally valid archive', () => {
    const zip = buildZip(
      [
        { path: 'a.md', content: 'hello' },
        { path: 'dir/b.md', content: 'world' },
      ],
      { now: NOW }
    )
    // Local file header, central directory, and EOCD signatures
    expect(zip.readUInt32LE(0)).toBe(0x04034b50)
    expect(zip.includes(Buffer.from([0x50, 0x4b, 0x01, 0x02]))).toBe(true)
    expect(zip.readUInt32LE(zip.length - 22)).toBe(0x06054b50)
    // EOCD entry count
    expect(zip.readUInt16LE(zip.length - 22 + 10)).toBe(2)
    // File contents are stored verbatim
    expect(zip.includes(Buffer.from('hello'))).toBe(true)
    expect(zip.includes(Buffer.from('dir/b.md'))).toBe(true)
  })
})
