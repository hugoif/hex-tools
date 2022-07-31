import React from "react";
import Table from "react-bootstrap/table";

import type { HugoDictionary, HugoSpecialWord } from "services/hexparser";

interface SpecialWordTableProps {
    dictionary: HugoDictionary;
    title: string;
    words: HugoSpecialWord[];
}

const SpecialWordTable: React.FC<SpecialWordTableProps> = ({ dictionary, title, words }) => {
    return <section>
        <h3>{title[0].toUpperCase() + title.substring( 1 )}</h3>
        <Table>
            <thead>
                <tr>
                    <th>
                        Word 1
                    </th>
                    <th>
                        Word 2
                    </th>
                </tr>
            </thead>
            <tbody>
                {words.map( ({ addr1, addr2 }) => <tr key={addr1 + "." + addr2}>
                    <td>
                        {dictionary[ addr1 ]}
                    </td>
                    {addr2 > 0 ? <td>{dictionary[ addr2 ]}</td> : <td>&mdash;</td>}
                </tr> )}
            </tbody>
        </Table>
    </section>;
};

export default SpecialWordTable;
