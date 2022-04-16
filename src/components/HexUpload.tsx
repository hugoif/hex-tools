import React, { ReactElement, useCallback } from "react";
import Dropzone, { FileRejection } from "react-dropzone";

import "./HexUpload.scss";

interface HexUploadProps {
    onError( error: string | null ): void;
    onUpload( hexFile: File ): void;
}

const HexUpload: React.FC<HexUploadProps> = ({ onError, onUpload }) => {
    const onDrop = useCallback( ( acceptedFiles: File[] ) => {
        onError( null );
        onUpload( acceptedFiles[0] );
    }, [] );

    const onReject = useCallback( ( errors: FileRejection[] ) => {
        if( errors.length > 1 ) {
            onError( "Drag only one file at a time" );
            return;
        }

        onError( errors[0].errors[0].message );
    }, [] );

    return (
        <section>
            <article id="upload-info">
                <h1>Hugo .hex file inspection tools</h1>

                <p>
                    Drop a <a href="https://hugoif.github.io">Hugo</a> .hex game file below to inspect what it contains.
                </p>
            </article>

            <Dropzone onDrop={onDrop} onDropRejected={onReject} multiple={false}>
                {({ getRootProps, getInputProps, isDragActive }): ReactElement => (
                    <div className={"file-upload-area" + ( isDragActive ? " drag-active" : "" )} {...getRootProps()}>
                        <input {...getInputProps()} />
                        <p>Drop a .hex file here or click to select</p>
                    </div>
                )}
            </Dropzone>
        </section>
    );
};

export default HexUpload;
