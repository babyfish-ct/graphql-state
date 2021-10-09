import { FC, memo } from "react";
import { useStateAsyncValue } from "graphql-state";
import { ComponentDecorator } from "../../common/ComponentDecorator";
import { totalState } from "./State";
import { Spin } from "antd";

/*
 * This component must be wrapped by <Suspense/>
 * otherwise, error will be raised.
 */
export const OutputViewForAsyncValueStyle: FC = memo(() => {

    const {data, loading } = useStateAsyncValue(totalState);

    return (
        <ComponentDecorator name="OutputViewForAsyncValueStyle">
            { 
                loading && 
                <div>
                    <Spin/>
                    Loading...(Implementd by the component itself)
                </div>
            }
            {
                !loading && data &&
                <>x * 2 + x * 3 = {data}</>
            }
        </ComponentDecorator>
    );
});