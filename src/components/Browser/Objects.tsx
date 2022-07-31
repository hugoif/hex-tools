import React from "react";
import Table from "react-bootstrap/table";

import { signedInt, toHexString } from "services/format";
import { HugoObject, HugoProperty, HugoStory } from "services/hexparser";

const directionAttributes = [
    "N to",
    "NE to",
    "E to",
    "SE to",
    "S to",
    "SW to",
    "W to",
    "NW to",
    "U to",
    "D to",
    "In to",
    "Out to"
] as const;

const otherAttributes = [
    "Custom (24)",
    "Key",
    "Short description when open",
    "Short description when closed",
    "Ignore response",
    "Order response",
    "Contains description",
    "Inventory description",
    "Description detail",
    "Custom (33)",
    "Custom (34)",
    "Custom (35)"
];

interface ObjectsProps {
    data: HugoStory;
}

const Objects: React.FC<ObjectsProps> = ({ data }) => {
    const { dictionary, objects } = data;
    const values = Object.entries( objects ).sort( ( [ a ], [ b ] ) => Number( a ) - Number( b ) );

    const nameOf = ( obj: number | HugoObject | HugoProperty ): string => {
        if( typeof obj === "object" && "routine" in obj ) {
            return `[routine ${toHexString( obj.routine )}]`;
        }

        if( typeof obj === "number" || typeof obj === "string" ) {
            return nameOf( objects[ Number( obj ) ] );
        }

        if( !obj || !( "properties" in obj ) ) {
            return "";
        }

        const target = obj.properties[0][0];

        if( !target ) {
            return "";
        }

        if( typeof target === "number" ) {
            return dictionary[ target ];
        }

        return `[routine ${toHexString( target.routine )}]`;
    };

    const dictName = ( address: HugoProperty ): string => {
        if( typeof address === "number" ) {
            return dictionary[address];
        }

        return `[routine ${toHexString( address.routine )}]`;
    };

    return <section>
        <Table>
            <thead>
                <tr>
                    <th>
                        #
                    </th>
                    <th>
                        article
                    </th>
                    <th>
                        name
                    </th>
                    <th>
                        type
                    </th>
                    <th>
                        nouns
                    </th>
                    <th>
                        adjectives
                    </th>
                    <th>
                        pronoun
                    </th>
                    <th>
                        properties
                    </th>
                    <th>
                        attributes
                    </th>
                    <th>
                        relations
                    </th>
                </tr>
            </thead>
            <tbody>
                {values.map( ( [ index, obj ] ) => <tr key={index}>
                    <td>
                        {index}
                    </td>
                    <td>
                        {obj.properties[5][0] > 0 && dictName( obj.properties[5][0] ) }
                    </td>
                    <td>
                        {nameOf( obj )}
                    </td>
                    <td>
                        {nameOf( obj.properties[14][0] )}
                    </td>
                    <td>
                        {( obj.properties[3].length > 1 || obj.properties[3][0] > 0 ) && <ul>
                                {obj.properties[3].map( ( noun, index ) => <li key={index + "." + noun}>
                                    {dictName( noun )}
                                </li> )}
                            </ul>}
                    </td>
                    <td>
                        {( obj.properties[4].length > 1 || obj.properties[4][0] > 0 ) && <ul>
                                {obj.properties[4].map( ( noun, index ) => <li key={index + "." + noun}>
                                    {dictionary[noun as number]}
                                </li> )}
                            </ul>}
                    </td>
                    <td>
                        {obj.properties[7][0] > 0 && dictName( obj.properties[7][0] )}
                    </td>
                    <td>
                        <ul>
                            {obj.properties[6][0] > 0 && <li>
                                Preposition: {dictName( obj.properties[6][0] )}
                                </li>}
                            {obj.properties[13][0] > 0 && <li>
                                Found in: {nameOf( obj.properties[13][0] )}
                                </li>}
                            {obj.properties[23][0] > 0 && <li>
                                Door to: {dictName( obj.properties[23][0] )}
                                </li>}
                            {obj.properties[36][0] > 0 && <li>
                                Can't go: {dictName( obj.properties[36][0] )}
                                </li>}
                            {obj.properties[21][0] > 0 && <li>
                                Parse rank: {signedInt( obj.properties[21][0] as number )}
                                </li>}
                            {obj.properties[22][0] > 0 && <li>
                                Excluded from "all"
                                </li>}
                            {obj.properties[14][0] === 4 && directionAttributes.map( ( desc, index ) => {
                                const propIndex = index + 24;
                                if( obj.properties[propIndex][0] > 0 ) {
                                    return <li key={desc}>
                                        {desc}: {nameOf( obj.properties[propIndex][0] )}
                                    </li>;
                                }

                                return null;
                            })}
                            {obj.properties[14][0] !== 4 && otherAttributes.map( ( desc, index ) => {
                                const propIndex = index + 24;
                                const prop = obj.properties[propIndex][0];

                                if( prop <= 0 ) {
                                    return null;
                                }

                                const propVal = ( typeof prop === "object" && "routine" in prop ) ? `[routine ${toHexString( prop.routine )}]` : prop;

                                switch( index ) {
                                    case 0:
                                    case 6:
                                    case 9:
                                    case 10:
                                    case 11:
                                        return <li key={desc}>
                                            {desc}: {propVal}
                                        </li>;

                                    case 1:
                                        return <li key={desc}>
                                            {desc}: {nameOf( prop )}
                                        </li>;

                                    case 2:
                                    case 3:
                                    case 4:
                                    case 5:
                                    case 7:
                                    case 8:
                                        return <li key={desc}>
                                            {desc}: {dictName( prop )}
                                        </li>;

                                }
                            })}
                            {obj.properties.slice( 36 ).map( ( prop, index ) => {
                                const propIndex = index + 36;

                                if( prop[0] > 0 ) {
                                    const propVal = ( typeof prop[0] === "object" && "routine" in prop[0] ) ? `[routine ${toHexString( prop[0].routine )}]` : prop[0];
                                    return <li key={propIndex + "." + propVal}>
                                        Custom ({propIndex}): {propVal}
                                    </li>;
                                }

                                return null;
                            })}
                        </ul>
                    </td>
                    <td>
                        <ul>
                            {obj.attributes.map( ( attr, index ) => <li key={attr + "." + index}>
                                {attr}
                            </li> )}
                        </ul>
                    </td>
                    <td>
                        <ul>
                            {obj.parent > 0 && <li>Parent: {nameOf( obj.parent )} ({obj.parent})</li>}
                            {obj.child > 0 && <li>Child: {nameOf( obj.child )} ({obj.child})</li>}
                            {obj.sibling > 0 && <li>Sibling: {nameOf( obj.sibling )} ({obj.sibling})</li>}
                        </ul>
                    </td>
                </tr>
                )}
            </tbody>
        </Table>
        <div>
            <small>Attributes and properties interpreted as they're used in the standard Hugo Library</small>
        </div>
    </section>;
};

export default Objects;
