import { Button, Col, Input, Row } from "antd";
import { useStateAccessor } from "graphql-state";
import { ChangeEvent, FC, memo, useCallback, useEffect, useState } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { bookNameState } from "./State";

export const Filter: FC = memo(() => {

    const [intervalId, setIntervalId] = useState<NodeJS.Timeout>();

    const name = useStateAccessor(bookNameState);

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        name(e.target.value);
    }, [name]);

    const onAutoEditingClick = useCallback(() => {
        setIntervalId(old => {
            if (old === undefined) {
                name("");
                return setInterval(() => {
                    if (name().length >= TEMPLATE.length) {
                        name("");
                    } else {
                        name(TEMPLATE.substring(0, name().length + 1));
                    }
                }, 200);
            } else {
                return undefined;
            }
        });
    }, [name]);

    useEffect(() => {
        if (intervalId !== undefined) {
            return () => {
                clearInterval(intervalId);
            }
        }
    }, [intervalId]);

    return (
        <ComponentDecorator name="Filter">
            <Row>
                <Col flex={1}>
                    <Input 
                    value={name()} 
                    onChange={onNameChange} 
                    disabled={intervalId !== undefined}
                    placeholder="Please input name to filter books..."/>
                </Col>
                <Col>
                    <Button onClick={onAutoEditingClick}>
                        {intervalId === undefined ? "Start auto editing" : "Stop auto editing"}
                    </Button>
                </Col>
            </Row>
        </ComponentDecorator>
    );
});

const TEMPLATE = "GraphQL in Action. Aha, I love GraphQL";