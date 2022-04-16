import React from "react";
import Button from "react-bootstrap/button";
import Container from "react-bootstrap/container";
import Tab from "react-bootstrap/tab";
import Tabs from "react-bootstrap/tabs";

import Dictionary from "./Dictionary";
import FileInfo from "./FileInfo";
import Textbank from "./Textbank";

import type { HugoStory } from "services/hexparser";

import "./BrowserNavigation.scss";

interface BrowserNavigationProps {
    data: HugoStory;
    onReset(): void;
}

const BrowserNavigation: React.FC<BrowserNavigationProps> = ({ data, onReset }) => {
    return <Container id="browser-navigation">
        <Button variant="outline-secondary" size="sm" onClick={onReset} className="float-end">
            &larr; back
        </Button>
        <Tabs defaultActiveKey="info">
            <Tab eventKey="info" title="File Info">
                <FileInfo data={data} />
            </Tab>
            <Tab eventKey="dictionary" title="Dictionary">
                <Dictionary data={data} />
            </Tab>
            <Tab eventKey="textbank" title="Text Bank">
                <Textbank data={data} />
            </Tab>
        </Tabs>
    </Container>;
};

export default BrowserNavigation;
