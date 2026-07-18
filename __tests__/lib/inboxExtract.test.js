import {
  assertPublicHttpUrl,
  detectSourceType,
  extractHtmlMeta,
  extractYouTubeId,
  htmlToText,
  isPrivateHost,
  textIsBareUrl,
  truncateText,
} from '@/lib/inboxExtract'

describe('extractYouTubeId', () => {
  it('handles all common URL shapes', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ?t=10')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for non-YouTube URLs and junk', () => {
    expect(extractYouTubeId('https://example.com/watch?v=abc')).toBeNull()
    expect(extractYouTubeId('not a url')).toBeNull()
    expect(extractYouTubeId(null)).toBeNull()
  })
})

describe('detectSourceType', () => {
  it('classifies captures', () => {
    expect(detectSourceType({ url: 'https://youtu.be/dQw4w9WgXcQ' })).toBe('youtube')
    expect(detectSourceType({ url: 'https://example.com/post' })).toBe('article')
    expect(detectSourceType({ url: 'https://example.com/paper.pdf' })).toBe('pdf')
    expect(detectSourceType({ fileName: 'notes.pdf', fileType: 'application/pdf' })).toBe('pdf')
    expect(detectSourceType({ fileName: 'notes.md' })).toBe('text')
    expect(detectSourceType({ text: 'Recursion is when a function calls itself.' })).toBe('text')
  })

  it('promotes bare-URL text blobs (share sheets put links in text)', () => {
    expect(detectSourceType({ text: '  https://www.youtube.com/watch?v=dQw4w9WgXcQ ' })).toBe('youtube')
    expect(detectSourceType({ text: 'https://example.com/article' })).toBe('article')
  })

  it('returns null when there is nothing usable', () => {
    expect(detectSourceType({})).toBeNull()
    expect(detectSourceType({ text: '   ' })).toBeNull()
  })
})

describe('textIsBareUrl', () => {
  it('detects lone URLs but not prose containing URLs', () => {
    expect(textIsBareUrl('https://example.com/a')).toBe(true)
    expect(textIsBareUrl('check out https://example.com/a today')).toBe(false)
    expect(textIsBareUrl('')).toBe(false)
  })
})

describe('isPrivateHost / assertPublicHttpUrl', () => {
  it('blocks local and private targets', () => {
    for (const host of [
      'localhost', 'api.localhost', 'foo.local', 'db.internal', 'metadata.google.internal',
      '127.0.0.1', '10.0.0.5', '172.16.0.1', '172.31.255.255', '192.168.1.1',
      '169.254.169.254', '0.0.0.0', '[::1]', '::1',
    ]) {
      expect(isPrivateHost(host)).toBe(true)
    }
  })

  it('allows public hosts', () => {
    for (const host of ['example.com', '93.184.216.34', '172.15.0.1', '172.32.0.1', 'youtube.com']) {
      expect(isPrivateHost(host)).toBe(false)
    }
  })

  it('assertPublicHttpUrl rejects non-http and private URLs', () => {
    expect(() => assertPublicHttpUrl('ftp://example.com/f')).toThrow(/http/)
    expect(() => assertPublicHttpUrl('javascript:alert(1)')).toThrow()
    expect(() => assertPublicHttpUrl('http://169.254.169.254/latest/meta-data')).toThrow(/private/i)
    expect(() => assertPublicHttpUrl('nonsense')).toThrow(/valid URL/i)
    expect(assertPublicHttpUrl('https://example.com/post').hostname).toBe('example.com')
  })
})

describe('htmlToText', () => {
  it('strips scripts, styles and chrome; keeps article text', () => {
    const html = `
      <html><head><title>T</title><style>.x{color:red}</style></head>
      <body>
        <nav>Home | About</nav>
        <article>
          <h1>Recursion Explained</h1>
          <p>A function that calls itself.</p>
          <script>alert("nope")</script>
          <ul><li>Base case</li><li>Recursive case</li></ul>
        </article>
        <footer>© 2026</footer>
      </body></html>`
    const text = htmlToText(html)
    expect(text).toContain('Recursion Explained')
    expect(text).toContain('A function that calls itself.')
    expect(text).toContain('• Base case')
    expect(text).not.toContain('alert')
    expect(text).not.toContain('color:red')
    expect(text).not.toContain('Home | About')
  })

  it('decodes entities', () => {
    expect(htmlToText('<p>Fish &amp; Chips &lt;3 &#65;</p>')).toBe('Fish & Chips <3 A')
  })

  it('handles empty/invalid input', () => {
    expect(htmlToText('')).toBe('')
    expect(htmlToText(null)).toBe('')
  })
})

describe('extractHtmlMeta', () => {
  it('prefers og:title and finds site name', () => {
    const html = `<head>
      <title>Fallback</title>
      <meta property="og:title" content="Real Title" />
      <meta property="og:site_name" content="Cool Blog" />
    </head>`
    expect(extractHtmlMeta(html)).toEqual({ title: 'Real Title', siteName: 'Cool Blog' })
  })

  it('falls back to <title>', () => {
    expect(extractHtmlMeta('<title>Only Title</title>').title).toBe('Only Title')
  })
})

describe('truncateText', () => {
  it('truncates on word boundaries with ellipsis', () => {
    const out = truncateText('the quick brown fox jumps', 15)
    expect(out.length).toBeLessThanOrEqual(16)
    expect(out.endsWith('…')).toBe(true)
  })

  it('leaves short strings alone', () => {
    expect(truncateText('short', 100)).toBe('short')
  })
})
