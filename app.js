/*
====================================================
NovaByte Engine V2
Part 1A
Core Binary Utilities
====================================================
*/

class ByteWriter {
    constructor() {
        this.buffer = [];
    }

    writeByte(value) {
        this.buffer.push(value & 0xFF);
    }

    writeBytes(bytes) {
        for (let i = 0; i < bytes.length; i++) {
            this.writeByte(bytes[i]);
        }
    }

    writeUint16(value) {
        this.writeByte(value & 255);
        this.writeByte((value >> 8) & 255);
    }

    writeUint32(value) {
        this.writeByte(value & 255);
        this.writeByte((value >> 8) & 255);
        this.writeByte((value >> 16) & 255);
        this.writeByte((value >> 24) & 255);
    }

    writeString(text) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(text);

        this.writeUint32(bytes.length);
        this.writeBytes(bytes);
    }

    toUint8Array() {
        return new Uint8Array(this.buffer);
    }
}

class ByteReader {

    constructor(uint8Array) {
        this.data = uint8Array;
        this.offset = 0;
    }

    readByte() {
        return this.data[this.offset++];
    }

    readBytes(length) {
        const slice = this.data.slice(this.offset, this.offset + length);
        this.offset += length;
        return slice;
    }

    readUint16() {
        return this.readByte()
            | (this.readByte() << 8);
    }

    readUint32() {
        return this.readByte()
            | (this.readByte() << 8)
            | (this.readByte() << 16)
            | (this.readByte() << 24);
    }

    readString() {
        const length = this.readUint32();
        const bytes = this.readBytes(length);

        return new TextDecoder().decode(bytes);
    }

    hasMore() {
        return this.offset < this.data.length;
    }

}

class BinaryFileLoader {

    static load(file) {

        return new Promise((resolve, reject) => {

            const reader = new FileReader();

            reader.onload = e => {

                resolve(
                    new Uint8Array(e.target.result)
                );

            };

            reader.onerror = reject;

            reader.readAsArrayBuffer(file);

        });

    }

}

class BinaryFileSaver {

    static download(bytes, filename) {

        const blob = new Blob(
            [bytes],
            {
                type: "application/octet-stream"
            }
        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;

        a.download = filename;

        document.body.appendChild(a);

        a.click();

        a.remove();

        URL.revokeObjectURL(url);

    }

}
/*
====================================================
NovaByte Engine V2
Part 1B
Bit Stream Engine
====================================================
*/

class BitWriter {

    constructor() {
        this.bytes = [];
        this.currentByte = 0;
        this.bitPosition = 0;
    }

    writeBit(bit) {

        if (bit) {
            this.currentByte |= (1 << (7 - this.bitPosition));
        }

        this.bitPosition++;

        if (this.bitPosition === 8) {
            this.bytes.push(this.currentByte);
            this.currentByte = 0;
            this.bitPosition = 0;
        }

    }

    writeBits(value, count) {

        for (let i = count - 1; i >= 0; i--) {

            this.writeBit(
                (value >> i) & 1
            );

        }

    }

    writeByte(byte) {

        this.writeBits(byte, 8);

    }

    flush() {

        if (this.bitPosition > 0) {

            this.bytes.push(this.currentByte);

            this.currentByte = 0;

            this.bitPosition = 0;

        }

    }

    toUint8Array() {

        this.flush();

        return new Uint8Array(this.bytes);

    }

}

class BitReader {

    constructor(data) {

        this.data = data;

        this.byteIndex = 0;

        this.bitIndex = 0;

    }

    readBit() {

        if (this.byteIndex >= this.data.length) {

            return null;

        }

        const bit =
            (this.data[this.byteIndex] >>
            (7 - this.bitIndex)) & 1;

        this.bitIndex++;

        if (this.bitIndex === 8) {

            this.bitIndex = 0;

            this.byteIndex++;

        }

        return bit;

    }

    readBits(count) {

        let value = 0;

        for (let i = 0; i < count; i++) {

            const bit = this.readBit();

            if (bit === null) {

                return null;

            }

            value =
                (value << 1) | bit;

        }

        return value;

    }

    readByte() {

        return this.readBits(8);

    }

    hasMore() {

        return this.byteIndex < this.data.length;

    }

}


/*
====================================================
NovaByte Engine V2
Part 1C
CRC32 + Package Header
====================================================
*/

class CRC32 {

    static table = null;

    static generateTable() {

        if (this.table) return this.table;

        this.table = [];

        for (let i = 0; i < 256; i++) {

            let crc = i;

            for (let j = 0; j < 8; j++) {

                if (crc & 1) {

                    crc = (crc >>> 1) ^ 0xEDB88320;

                } else {

                    crc >>>= 1;

                }

            }

            this.table[i] = crc >>> 0;

        }

        return this.table;

    }

    static calculate(bytes) {

        const table = this.generateTable();

        let crc = 0xFFFFFFFF;

        for (let i = 0; i < bytes.length; i++) {

            crc =
                (crc >>> 8) ^
                table[(crc ^ bytes[i]) & 0xFF];

        }

        return (crc ^ 0xFFFFFFFF) >>> 0;

    }

}

class NovaByteHeader {

    static MAGIC = "NVB2";

    static VERSION = 1;

    static write(writer, info) {

        writer.writeString(this.MAGIC);

        writer.writeUint16(this.VERSION);

        writer.writeString(info.algorithm);

        writer.writeString(info.fileType);

        writer.writeString(info.fileName);

        writer.writeUint32(info.originalSize);

    }

    static read(reader) {

        const magic = reader.readString();

        if (magic !== this.MAGIC) {

            throw new Error("Invalid NovaByte package.");

        }

        const version = reader.readUint16();

        if (version !== this.VERSION) {

            throw new Error("Unsupported NovaByte version.");

        }

        return {

            version,

            algorithm: reader.readString(),

            fileType: reader.readString(),

            fileName: reader.readString(),

            originalSize: reader.readUint32()

        };

    }

}

/*
====================================================
NovaByte Engine V2
Part 2A (Revised)
File Analyzer
====================================================
*/

class FileAnalyzer {

    static analyze(bytes, fileName = "") {

        const extension = this.getExtension(fileName);

        const fileType = this.detectType(extension);

        const entropy = this.calculateEntropy(bytes);

        const size = bytes.length;

        return {

            fileName,

            extension,

            fileType,

            size,

            entropy,

            alreadyCompressed:
                this.isAlreadyCompressed(fileType),

            recommendedAlgorithm:
                this.getRecommendation(
                    fileType,
                    entropy
                )

        };

    }

    static getExtension(name) {

        const index = name.lastIndexOf(".");

        if (index === -1)
            return "";

        return name
            .substring(index + 1)
            .toLowerCase();

    }

    static detectType(ext) {

        const map = {

            text: [
                "txt",
                "js",
                "json",
                "css",
                "html",
                "xml",
                "md",
                "csv"
            ],

            image: [
                "bmp",
                "png",
                "jpg",
                "jpeg",
                "gif",
                "webp"
            ],

            audio: [
                "wav",
                "mp3",
                "ogg",
                "flac"
            ],

            video: [
                "mp4",
                "avi",
                "mov",
                "mkv",
                "webm"
            ],

            archive: [
                "zip",
                "rar",
                "7z",
                "apk"
            ]

        };

        for (const key in map) {

            if (map[key].includes(ext))
                return key;

        }

        return "binary";

    }

    static calculateEntropy(bytes) {

        if (!bytes.length)
            return 0;

        const frequency =
            new Uint32Array(256);

        for (const byte of bytes)
            frequency[byte]++;

        let entropy = 0;

        for (const count of frequency) {

            if (!count)
                continue;

            const p =
                count / bytes.length;

            entropy -=
                p * Math.log2(p);

        }

        return Number(
            entropy.toFixed(2)
        );

    }

    static isAlreadyCompressed(type) {

        return [

            "video",

            "archive"

        ].includes(type);

    }

    static getRecommendation(type, entropy) {

        if (type === "text")
            return "LZ77 + Huffman";

        if (type === "image") {

            if (entropy < 6)
                return "RLE + Huffman";

            return "LZ77";

        }

        if (type === "audio") {

            if (entropy < 6)
                return "Delta + Huffman";

            return "LZ77";

        }

        if (type === "video")
            return "Store";

        if (type === "archive")
            return "Store";

        if (entropy < 5)
            return "RLE";

        return "LZ77";

    }

}
/*
====================================================
NovaByte Engine V2
Part 2B
LZ77 Token Generator
====================================================
*/

class LZ77 {

    static WINDOW_SIZE = 4096;

    static LOOKAHEAD_SIZE = 258;

    static MIN_MATCH = 3;

    static compress(bytes) {

        const tokens = [];

        let cursor = 0;

        while (cursor < bytes.length) {

            let bestLength = 0;
            let bestDistance = 0;

            const windowStart =
                Math.max(
                    0,
                    cursor - this.WINDOW_SIZE
                );

            for (
                let search = windowStart;
                search < cursor;
                search++
            ) {

                let length = 0;

                while (

                    length < this.LOOKAHEAD_SIZE &&

                    cursor + length < bytes.length &&

                    bytes[search + length] ===
                    bytes[cursor + length]

                ) {

                    length++;

                }

                if (length > bestLength) {

                    bestLength = length;

                    bestDistance =
                        cursor - search;

                }

            }

            if (bestLength >= this.MIN_MATCH) {

              const literal =

    cursor + bestLength < bytes.length

        ? bytes[cursor + bestLength]

        : null;

tokens.push({

    type: "match",

    distance: bestDistance,

    length: bestLength,

    literal

});

cursor += bestLength + 1;

            }

            else {

                tokens.push({

                    type: "literal",

                    value: bytes[cursor]

                });

                cursor++;

            }

        }

        return tokens;

    }

}

/*
====================================================
NovaByte Engine V2
Part 2C
LZ77 Decompressor
====================================================
*/

class LZ77Decoder {

    static decompress(tokens) {

        const output = [];

        for (const token of tokens) {

            // Literal byte
            if (token.type === "literal") {

                output.push(token.value);

                continue;

            }

            // Match token
            const start =
                output.length - token.distance;

            for (let i = 0; i < token.length; i++) {

                output.push(
                    output[start + i]
                );

            }

            if (token.literal !== null) {

                output.push(
                    token.literal
                );

            }

        }

        return new Uint8Array(output);

    }

}

/*
====================================================
NovaByte Engine V2
Part 2D
LZ77 Binary Serializer
====================================================
*/

class LZ77Serializer {

    static serialize(tokens) {

        const writer = new ByteWriter();

        writer.writeUint32(tokens.length);

        for (const token of tokens) {

            if (token.type === "literal") {

                writer.writeByte(0);

                writer.writeByte(token.value);

            }

            else {

                writer.writeByte(1);

                writer.writeUint16(token.distance);

                writer.writeUint16(token.length);

                writer.writeByte(
                    token.literal === null
                        ? 0
                        : 1
                );

                if (token.literal !== null) {

                    writer.writeByte(
                        token.literal
                    );

                }

            }

        }

        return writer.toUint8Array();

    }

    static deserialize(bytes) {

        const reader = new ByteReader(bytes);

        const total =
            reader.readUint32();

        const tokens = [];

        for (let i = 0; i < total; i++) {

            const type =
                reader.readByte();

            if (type === 0) {

                tokens.push({

                    type: "literal",

                    value:
                        reader.readByte()

                });

            }

            else {

                const distance =
                    reader.readUint16();

                const length =
                    reader.readUint16();

                const hasLiteral =
                    reader.readByte();

                let literal = null;

                if (hasLiteral) {

                    literal =
                        reader.readByte();

                }

                tokens.push({

                    type: "match",

                    distance,

                    length,

                    literal

                });

            }

        }

        return tokens;

    }

}
