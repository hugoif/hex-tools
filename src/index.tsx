import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.scss";

const rootElement = document.getElementById( "root" );

if( !rootElement ) {
    throw new Error( "Root HTML element (#root) not found" );
}

const reactRoot = ReactDOM.createRoot( rootElement );
reactRoot.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
