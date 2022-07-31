import { toHexString } from "./format";

interface HugoAddresses {
    code: number,
    endgame: number,
    findobject: number,
    init: number,
    main: number,
    parse: number,
    parseerror: number,
    perform: number
    speakto: number,
}

type HugoArrays = { [key: number]: number[] };
type HugoCode = number[];
export type HugoDictionary = {[key: number]: string};

interface HugoEvent {
    addr: number;
    obj: number;
}

type HugoEvents = HugoEvent[];
type HugoGlobals = number[];

interface HugoGrammar {
    nouns: number[][];
    type: "verb" | "xverb";
    verbs: number[];
}

type HugoGrammars = HugoGrammar[];

export interface HugoObject {
    attributes: string[];
    child: number;
    parent: number;
    properties: HugoProperty[][];
    sibling: number;
}

export type HugoObjects = HugoObject[];
export type HugoProperty = number | { routine: number };
export type HugoSpecialWord = { addr1: number, addr2: number };

enum HugoSpecialWordCategory {
    SYNONYMS = "synonyms",
    REMOVALS = "removals",
    COMPOUNDS = "compounds",
    PUNCTUATION = "punctuation"
}

type HugoSpecialWords = {[key in HugoSpecialWordCategory]: HugoSpecialWord[]};

export interface HugoStory {
    addresses: HugoAddresses;
    arrays: HugoArrays;
    code: HugoCode;
    compilerVersion: number;
    counts: { [key: string]: number };
    dictionary: HugoDictionary;
    events: HugoEvents;
    file?: File;
    globals: HugoGlobals;
    grammar: HugoGrammars;
    id: number;
    ifids: string[];
    objects: HugoObjects;
    serial: string;
    specialwords: HugoSpecialWords;
    textbank: HugoTextbank;
    word: number[];
}

type HugoTextbank = {[key: number]: string};

const SERIAL$_INDEX = -15;
const PARSE$_INDEX = -16;

const attributeNames = [
    "known",
    "moved/visited",
    "static",
    "plural",
    "living",
    "female",
    "openable",
    "open",
    "lockable",
    "locked",
    "unfriendly",
    "light",
    "readable",
    "switchable",
    "switchedon/active",
    "clothing",
    "worn/mobile",
    "enterable",
    "container",
    "platform",
    "hidden",
    "quiet",
    "transparent"
] as const;

let propertyDefaults: HugoProperty[][] = [];
let buffer: Uint8Array;

export const parseHexFile = ( storyfile: ArrayBuffer ): HugoStory => {
    buffer = new Uint8Array( storyfile );
    const data = parseStoryFile();

    // free up memory, could assign null but then everything would need a null check
    buffer = new Uint8Array();

    return data;
};

const overflow = ( num: number ): number => {
    if( num > 32767 ) {
        return ( ( num + 32768 ) % 65536 ) - 32768;
    }

    return num;
};

const charAt = ( offset: number ): string => {
    return String.fromCharCode( buffer[ offset ] );
};

const wordAt = ( offset: number ): number => {
    return buffer[ offset ] + buffer[ offset + 1 ] * 256;
};

const readArrays = ( offset: number, offsetEnd: number ): HugoArrays => {
    const arrays: HugoArrays = {};
    let ptr = offset + 480;

    while( ptr < offsetEnd ) {
        const arrayLength = wordAt( ptr );
        const index = ( ptr - offset ) / 2;
        const contents = [];

        ptr += 2;

        for( let i = 0; i < arrayLength; ++i ) {
            contents.push( wordAt( ptr ) );
            ptr += 2;
        }
        arrays[ index ] = contents;
    }

    // There's no way to distinguish between zero-length arrays and
    // zero padding at the end of the array table. While it's improbable
    // that anyone would have use for a zero-length array, the Hugo
    // compiler accepts it so we'll have to play it safe and not trim
    // zero-length arrays from the end.

    return arrays;
};

const readCode = ( offset: number, offsetEnd: number ): HugoCode => {
    const code: HugoCode = [];

    for( let i = offset; i < offsetEnd; ++i ) {
        code.push( buffer[ i ] );
    }

    // trim zero padding from the end
    while( code[ code.length - 1 ] === 0 ) {
        code.pop();
    }

    return code;
};

const readDictionary = ( offset: number, dictcount: number ): HugoDictionary => {
    const dict: HugoDictionary = {};
    let ptr = offset + 2;

    for( let i = 0; i < dictcount; ++i ) {
        const strlen = buffer[ ptr ];
        let str = "";

        for( let j = 0; j < strlen; ++j ) {
            str += String.fromCharCode( buffer[ ptr + 1 + j ] - 20 );
        }

        dict[ ptr - offset - 2 ] = str;

        ptr += ( strlen + 1 );
    }

    return dict;
};

const readEvents = ( offset: number, eventcount: number ): HugoEvent[] => {
    const events: HugoEvent[] = [];
    let ptr = offset + 2;

    for( let i = 0; i < eventcount; ++i ) {
        events.push({
            addr: wordAt( ptr + 2 ),
            obj: wordAt( ptr )
        });

        ptr += 4;
    }

    return events;
};

const readGlobals = ( offset: number ): HugoGlobals => {
    const globals: HugoGlobals = [];

    for( let i = 0; i < 240; ++i ) {
        globals.push( overflow( wordAt( offset + i * 2 ) ) );
    }

    return globals;
};

const readGrammar = (): HugoGrammars => {
    const grammar: HugoGrammars = [];
    let ptr = 0x40;

    while( buffer[ ptr ] !== 0xff && ptr < buffer.length ) {
        const g: Partial<HugoGrammar> = {};
        const verbType = buffer[ ptr ];

        switch( verbType ) {
            case 0x2c:
                g.type = "verb";
                break;
            case 0x2d:
                g.type = "xverb";
                break;
            default:
                throw new Error( `Unknown verb type ${toHexString( verbType )} encountered while reading grammar` );
        }

        const verbcount = buffer[ ptr + 1 ],
            verbs = [];

        ptr += 2;

        for( let i = 0; i < verbcount; ++i ) {
            verbs.push( wordAt( ptr ) );
            ptr += 2;
        }

        g.verbs = verbs;

        // TODO: verb get_object header

        const grammarLines: number[][] = [];
        let line = [];

        /**
         * In contrast to the techical manual, the grammar syntax
         * seems to be
         * 08 xx y1 y2 y3 ...
         * where 08 is * and xx is the number of tokens that belong
         * to this grammar line, including the asterisk but excluding
         * the count itself.
         *
         * We'll drop the asterisk as redundant.
         */
        while( ptr < buffer.length ) {
            ptr++;  // skip over the asterisk
            const grammarLength = buffer[ ptr ] - 1;
            ptr++;  // skip over the count

            for( let j = 0; j < grammarLength; ++j, ++ptr ) {
                line.push( buffer[ ptr ] );
            }

            grammarLines.push( line );

            const grammarByte = buffer[ ptr ];

            if( grammarByte === 0x2c || grammarByte === 0x2d || grammarByte === 0xff ) {
                break;
            }

            if( grammarByte !== 0x08 ) {
                throw new Error( `Expected 0x08, 0x2c, 0x2d or 0xff when reading grammar, found ${toHexString( grammarByte )} instead at ${toHexString( ptr )}` );
            }

            line = [];
        }
        g.nouns = grammarLines;

        grammar.push( g as HugoGrammar );
    }

    return grammar;
};

const readObjects = ( offset: number, objcount: number, proptableOffset: number ): HugoObject[] => {
    const objects: HugoObject[] = [];
    let ptr = offset + 2;

    for( let i = 0; i < objcount; ++i ) {
        const obj: Partial<HugoObject> = {};

        obj.attributes = [];

        for( let attrBytePtr = 0; attrBytePtr < 16; ++attrBytePtr ) {
            const attrByte = buffer[ attrBytePtr + ptr ];
            for( let attrBit = 0; attrBit < 8; ++attrBit ) {
                if( attrByte & Math.pow( 2, attrBit ) ) {
                    const attrIndex = attrBit + attrBytePtr * 8;
                    if( attrIndex >= attributeNames.length ) {
                        obj.attributes.push( `custom (${attrIndex})` );
                    }
                    else {
                        obj.attributes.push( attributeNames[attrIndex] );
                    }
                }
            }
        }

        obj.parent = wordAt( ptr + 16 );
        obj.sibling = wordAt( ptr + 18 );
        obj.child= wordAt( ptr + 20 );
        obj.properties = [];

        // copy default properties to the object
        for( let j = 0; j < propertyDefaults.length; ++j ) {
            obj.properties[ j ] = propertyDefaults[ j ];
        }

        // apply object-specific properties
        let propPtr = wordAt( ptr + 22 ) + proptableOffset;

        while( propPtr < buffer.length ) {
            const propNumber = buffer[ propPtr ],
                propWords = buffer[ propPtr + 1 ];

            if( propNumber === 0xff ) {
                break;
            }

            propPtr += 2;

            if( propWords === 0xff ) {
                obj.properties[ propNumber ] = [ { routine: wordAt( propPtr ) } ];
                propPtr += 2;
                continue;
            }

            if( propWords === 0 ) {
                obj.properties[ propNumber ][ 0 ] = 0;
            }
            else {
                obj.properties[ propNumber ] = [];

                for( let k = 0; k < propWords; ++k ) {
                    obj.properties[ propNumber ].push( wordAt( propPtr ) );
                    propPtr += 2;
                }
            }
        }

        objects.push( obj as HugoObject );
        ptr += 24;
    }

    return objects;
};

/**
 * readProptable reads only the default properties.
 * Actual values are added to objects directly.
 */
const readProptable = ( offset: number, propcount: number ): HugoProperty[][] => {
    const properties: HugoProperty[][] = [];
    let defaultValuePtr = offset + 2;

    for( let i = 0; i < propcount; ++i ) {
        properties.push( [ overflow( wordAt( defaultValuePtr ) ) ] );
        defaultValuePtr += 2;
    }

    return properties;
};

const readSpecialWords = ( offset: number, specialwordcount: number ): HugoSpecialWords => {
    const specialWords: Partial<HugoSpecialWords> = {};
    const categories: HugoSpecialWordCategory[] = Object.values( HugoSpecialWordCategory );
    let ptr = offset + 2;

    categories.forEach( category => {
        specialWords[ category as HugoSpecialWordCategory ] = [];
    });

    for( let i = 0; i < specialwordcount; ++i ) {
        const specialWord: HugoSpecialWord = {
            addr1: wordAt( ptr + 1 ),
            addr2: wordAt( ptr + 3 )
        };

        const type: HugoSpecialWordCategory = categories[ buffer[ ptr ] ];
        const wordArray = specialWords[ type ];

        if( !wordArray ) {
            throw new Error( `Encountered an unknown special word category index ${buffer[ ptr ]} at ${toHexString( ptr )}` );
        }

        wordArray.push( specialWord );
        ptr += 5;
    }

    return specialWords as HugoSpecialWords;
};

const readTextbank = ( offset: number, offsetEnd: number ): HugoTextbank => {
    const textbank: HugoTextbank = {};
    let ptr = offset;

    while( ptr < offsetEnd ) {
        const strlen = wordAt( ptr );
        let str = "";

        for( let i = 0; i < strlen; ++i ) {
            str += String.fromCharCode( buffer[ ptr + 2 + i ] - 20 );
        }

        textbank[ ptr - offset ] = str;
        ptr += strlen + 2;
    }

    return textbank;
};

const findIFIDs = ( dictionary: HugoDictionary, textbank: HugoTextbank ): string[] => {
    const ifids: Set<string> = new Set();
    const words = [ ...Object.values( dictionary ), ...Object.values( textbank ) ];

    words.forEach( text => {
        const match = text.match( /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i );

        if( match ) {
            ifids.add( match[0] );
        }
    });

    return Array.from( ifids );
};

const parseStoryFile = (): HugoStory => {
    const story: Partial<HugoStory> = {};
    let data, textbank, offset, counts;

    // check version
    let compilerVersion = buffer[ 0 ];

    if( compilerVersion === 1 || compilerVersion === 2 ) {
        compilerVersion *= 10;
    }

    if( compilerVersion !== 31 ) {
        throw new Error( "Invalid story file version or file not a Hugo story file. Only 3.1 supported, story file identifies itself as " + ( compilerVersion / 10 ).toFixed( 1 ) );
    }

    try {
        data = buffer[ 0x29 ];
        textbank = buffer[ 0x29 + 1 ];
        textbank = ( textbank * 256 + data ) * 16;
    }
    catch( e ) {
        throw new Error( "Story file ended unexpectedly when reading text bank" );
    }

    try {
        story.id = wordAt( 1 );
        story.serial = "";

        for( let i = 0; i < 8; ++i ) {
            story.serial += charAt( 3 + i );
        }
    }
    catch( e ) {
        throw new Error( "Story file ended unexpectedly when reading id and serial number" );
    }

    try {
        offset = {
            codestart: wordAt( 0x0B ),
            objtable: wordAt( 0x0D ) * 16,
            proptable: wordAt( 0x0F ) * 16,
            eventtable: wordAt( 0x11 ) * 16,
            arraytable: wordAt( 0x13 ) * 16,
            dicttable: wordAt( 0x15 ) * 16,
            specwordtable: wordAt( 0x17 ) * 16,
            textbank: textbank
        };

        story.addresses = {
            code: offset.codestart,
            init: wordAt( 0x19 ) * 16,
            main: wordAt( 0x1B ) * 16,
            parse: wordAt( 0x1D ) * 16,
            parseerror: wordAt( 0x1F ) * 16,
            findobject: wordAt( 0x21 ) * 16,
            endgame: wordAt( 0x23 ) * 16,
            speakto: wordAt( 0x25 ) * 16,
            perform: wordAt( 0x27 ) * 16
        };
    }
    catch( e ) {
        throw new Error( "Story file ended unexpectedly when reading offsets" );
    }

    try {
        counts = {
            objects: wordAt( offset.objtable ),
            events: wordAt( offset.eventtable ),
            dictwords: wordAt( offset.dicttable ),
            specialWords: wordAt( offset.specwordtable ),
            properties: wordAt( offset.proptable )
        };
    }
    catch( e ) {
        throw new Error( "Story file ended unexpectedly when counting elements" );
    }

    propertyDefaults = readProptable( offset.proptable, counts.properties );

    let debugStarts = 0;
    if( buffer[ 0x3a ] ) {
        debugStarts = buffer[ 0x3b ] + buffer[ 0x3b + 1 ] * 256 + buffer[ 0x3b + 2 ] * 256 * 256;
    }

    story.arrays = readArrays( offset.arraytable, offset.specwordtable );
    story.code = readCode( offset.codestart, offset.objtable );
    story.counts = counts;
    story.dictionary = readDictionary( offset.dicttable, counts.dictwords );
    story.events = readEvents( offset.eventtable, counts.events );
    story.globals = readGlobals( offset.arraytable );
    story.grammar = readGrammar();
    story.objects = readObjects( offset.objtable, counts.objects, offset.proptable );
    story.specialwords = readSpecialWords( offset.specwordtable, counts.specialWords );
    story.textbank = readTextbank( offset.textbank, debugStarts || buffer.length );
    story.word = [];
    story.ifids = findIFIDs( story.dictionary, story.textbank );

    // set special dictionary words
    story.dictionary[ PARSE$_INDEX ] = "";
    story.dictionary[ SERIAL$_INDEX ] = story.serial;

    story.compilerVersion = compilerVersion / 10;

    return story as HugoStory;
};
