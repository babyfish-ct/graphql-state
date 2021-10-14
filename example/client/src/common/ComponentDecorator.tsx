import { Card } from "antd";
import { FC, memo, PropsWithChildren } from "react";
import { css } from '@emotion/css';

export const ComponentDecorator: FC<
    PropsWithChildren<{
        readonly name: string
    }>
> = memo(({name, children}) => {
    return (
        <Card title={`Component: ${name}`} className={css({margin: "1rem"})}>
            {children}
        </Card>
    );
});