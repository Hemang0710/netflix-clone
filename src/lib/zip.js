// Minimal ZIP writer (store method, no compression) so exports need no new
// dependency. Markdown/CSV payloads are small; a stored archive is fine.
// Implements just enough of APPNOTE.TXT: local file headers, central
// directory, end-of-central-directory. UTF-8 filenames (general-purpose flag
// bit 11).

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  const year = Math.max(d.getFullYear(), 1980)
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2)
  const dosDate = ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  return { dosTime, dosDate }
}

/**
 * Build a ZIP archive from { path, content } entries.
 * @param {Array<{ path: string, content: string | Buffer }>} files
 * @param {{ now?: Date }} opts
 * @returns {Buffer}
 */
export function buildZip(files, { now = new Date() } = {}) {
  const { dosTime, dosDate } = dosDateTime(now)
  const locals = []
  const centrals = []
  let offset = 0

  for (const file of files) {
    const nameBuf = Buffer.from(file.path.replace(/\\/g, "/"), "utf8")
    const dataBuf = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content, "utf8")
    const crc = crc32(dataBuf)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0) // local file header signature
    local.writeUInt16LE(20, 4) // version needed
    local.writeUInt16LE(0x0800, 6) // flags: UTF-8 filename
    local.writeUInt16LE(0, 8) // method: store
    local.writeUInt16LE(dosTime, 10)
    local.writeUInt16LE(dosDate, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(dataBuf.length, 18) // compressed size
    local.writeUInt32LE(dataBuf.length, 22) // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28) // extra length

    locals.push(local, nameBuf, dataBuf)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0) // central directory signature
    central.writeUInt16LE(20, 4) // version made by
    central.writeUInt16LE(20, 6) // version needed
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt16LE(dosTime, 12)
    central.writeUInt16LE(dosDate, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(dataBuf.length, 20)
    central.writeUInt32LE(dataBuf.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    // extra/comment/disk/attrs left zero
    central.writeUInt32LE(offset, 42) // local header offset

    centrals.push(central, nameBuf)
    offset += local.length + nameBuf.length + dataBuf.length
  }

  const centralStart = offset
  const centralBuf = Buffer.concat(centrals)

  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0) // end of central directory signature
  eocd.writeUInt16LE(files.length, 8)
  eocd.writeUInt16LE(files.length, 10)
  eocd.writeUInt32LE(centralBuf.length, 12)
  eocd.writeUInt32LE(centralStart, 16)

  return Buffer.concat([...locals, centralBuf, eocd])
}
