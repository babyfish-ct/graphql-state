import { FC, memo } from "react";
import { Route, Switch } from "wouter";
import { App as WritableStateApp } from  '../simple/writale/App';
import { App as BasicComputedStateApp } from '../simple/computed/App';

export const ContentView: FC = memo(() =>{
    return (
        <Switch>
            <Route path="/simpleState/writableState" component={WritableStateApp}/>
            <Route path="/simpleState/computedState" component={BasicComputedStateApp}/>
        </Switch>
    );
});