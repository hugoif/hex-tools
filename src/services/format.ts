export const toHexString = ( value: number | string ): string => {
    const num = Number( value );
    let prefix = "";

    if( num === 0 ) {
        return "0x0";
    }

    if( num < 0 ) {
        prefix = "-";
    }

    prefix += "0x";

    const hexval = Math.abs( num ).toString( 16 );

    if( hexval.length % 2 === 1 ) {
        prefix += "0";
    }

    return prefix + hexval;
};

export const toHumanReadable = ( value: number | string ): string => {
    return Number( value ).toLocaleString();
};
