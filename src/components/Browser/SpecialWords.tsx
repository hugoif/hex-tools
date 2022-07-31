import React from "react";

import SpecialWordTable from "./SpecialWordTable";

import { HugoStory } from "services/hexparser";

interface SpecialWordsProps {
    data: HugoStory;
}

const SpecialWords: React.FC<SpecialWordsProps> = ({ data }) => {
    const { specialwords } = data;
    const values = Object.entries( specialwords ).sort( ( [ a ], [ b ] ) => Number( a ) - Number( b ) );

    return <section>
        {values.map( ( [ title, words ] ) => <SpecialWordTable key={title} dictionary={data.dictionary} title={title} words={words} /> )}
    </section>;
};

export default SpecialWords;
