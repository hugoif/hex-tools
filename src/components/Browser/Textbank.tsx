import React from "react";
import Table from "react-bootstrap/table";

import { toHexString } from "services/format";
import { HugoStory } from "services/hexparser";

interface TextbankProps {
    data: HugoStory;
}

const Textbank: React.FC<TextbankProps> = ({ data }) => {
    const { textbank } = data;
    const values = Object.entries( textbank ).sort( ( [ a ], [ b ] ) => Number( a ) - Number( b ) );

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

export default Textbank;
