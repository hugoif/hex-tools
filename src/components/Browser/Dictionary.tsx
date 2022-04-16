import React from "react";
import Table from "react-bootstrap/table";

import { HugoStory, toHexString } from "services/hexparser";

interface DictionaryProps {
    data: HugoStory;
}

const Dictionary: React.FC<DictionaryProps> = ({ data }) => {
    const { dictionary } = data;
    const values = Object.entries( dictionary ).sort( ( [ a ], [ b ] ) => Number( a ) - Number( b ) );

    return <section>
        <Table>
            <thead>
                <tr>
                    <th>
                        address
                    </th>
                    <th>
                        text
                    </th>
                </tr>
            </thead>
            <tbody>
                {values.map( ( [ address, text ] ) => <tr key={address}>
                    <td>{toHexString( address )}</td>
                    <td>{text}</td>
                </tr> )}
            </tbody>
        </Table>
    </section>;
};

export default Dictionary;
