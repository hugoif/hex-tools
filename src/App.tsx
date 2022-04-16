import React, { useState } from "react";
import { Alert, Container } from "react-bootstrap";

import HexUpload from "components/HexUpload";
import { HugoStory, parseHexFile } from "services/hexparser";

import "./App.scss";
import BrowserNavigation from "components/Browser/BrowserNavigation";

const App: React.FC = () => {
    const [ hexData, setHexData ] = useState<HugoStory | null>( null );
    const [ uploadError, setUploadError ] = useState<string | null>( null );

    const onFileUpload = ( hexFile: File ): void => {
        const reader = new FileReader();

        reader.onload = ( evt ): void => {
            if( !evt.target || !evt.target.result ) {
                setUploadError( "Unknown error while reading the file" );
                return;
            }

            const { result } = evt.target;

            if( typeof result === "string" ) {
                setUploadError( "Not a binary file" );
                return;
            }

            try {
                const data = parseHexFile( result );
                data.file = hexFile;
                setHexData( data );
            }
            catch( e ) {
                setUploadError( ( e as Error ).message );
            }
        };

        reader.readAsArrayBuffer( hexFile );
    };

    const reset = (): void => {
        setHexData( null );
    };

    if( !hexData ) {
        return (
            <div className="App">
                <Container>
                    <HexUpload onUpload={onFileUpload} onError={setUploadError} />
                    {uploadError && <Alert variant="danger">{uploadError}</Alert>}
                </Container>
            </div>
        );
    }

    return <BrowserNavigation data={hexData} onReset={reset} />;
};

export default App;
