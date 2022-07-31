import React from "react";
import Table from "react-bootstrap/table";
import { toHexString, toHumanReadable } from "services/format";

import { HugoStory } from "services/hexparser";

interface FileInfoProps {
    data: HugoStory;
}

const FileInfo: React.FC<FileInfoProps> = ({ data }) => {
    const { compilerVersion, counts, file, id, ifids, serial, textbank } = data;

    return <section>
        <header>
            <h2>
                Header
            </h2>
        </header>

        <Table>
            <tbody>
                {file && <tr>
                    <th>
                        File name
                    </th>
                    <td>
                        {file.name}
                    </td>
                </tr>}
                {file && <tr>
                    <th>
                        File size
                    </th>
                    <td>
                        {toHumanReadable( file.size )} bytes
                    </td>
                </tr>}
                <tr>
                    <th>
                        Compiler version
                    </th>
                    <td>
                        {compilerVersion.toFixed( 1 )}
                    </td>
                </tr>
                <tr>
                    <th>
                        ID string
                    </th>
                    <td>
                        {toHexString( id )}
                        {id === 9252 && <span>{" "}("$$", precompiled headers)</span>}
                    </td>
                </tr>
                <tr>
                    <th>
                        Serial number
                    </th>
                    <td>
                        {serial}
                    </td>
                </tr>
                <tr>
                    <th>
                        IFID (inferred)
                    </th>
                    <td>
                        {ifids.map( ifid => <div key={ifid}>
                            {ifid}
                        </div> )}
                    </td>
                </tr>
            </tbody>
        </Table>


        <header>
            <h2>
                Data
            </h2>
        </header>

        <Table>
            <thead>
                <tr>
                    <th>
                        Data Type
                    </th>
                    <th>
                        Count
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th>
                        Text bank
                    </th>
                    <td>
                        {toHumanReadable( Object.entries( textbank ).length )}
                    </td>
                </tr>
                <tr>
                    <th>
                        Dictionary words
                    </th>
                    <td>
                        {toHumanReadable( counts.dictwords )}
                    </td>
                </tr>
                <tr>
                    <th>
                        Special words
                    </th>
                    <td>
                        {toHumanReadable( counts.specialWords )}
                    </td>
                </tr>
                <tr>
                    <th>
                        Objects
                    </th>
                    <td>
                        {toHumanReadable( counts.objects )}
                    </td>
                </tr>
                <tr>
                    <th>
                        Events
                    </th>
                    <td>
                        {toHumanReadable( counts.events )}
                    </td>
                </tr>
                <tr>
                    <th>
                        Properties
                    </th>
                    <td>
                        {toHumanReadable( counts.properties )}
                    </td>
                </tr>
            </tbody>
        </Table>
    </section>;
};

export default FileInfo;
