export const toHumanReadable = ( value: number | string ): string => {
    return Number( value ).toLocaleString();
};
