import { FC, memo } from "react";
import { Route, Switch } from "wouter";
import { App as WritableStateApp } from  '../simple/writale/App';
import { App as ComputedStateApp } from '../simple/computed/App';
import { App as AsyncStateApp } from '../simple/async/App';
import { App as EffectApp } from '../simple/effect/App';
import { App as LocalDataApp } from '../graph/local/App';
import { App as GraphQLDataApp } from  '../graph/graphql/App';

export const ContentView: FC = memo(() =>{
    return (
        <Switch>
            <Route path="/simpleState/writableState" component={WritableStateApp}/>
            <Route path="/simpleState/computedState" component={ComputedStateApp}/>
            <Route path="/simpleState/asyncState" component={AsyncStateApp}/>
            <Route path="/simpleState/effect" component={EffectApp}/>
            <Route path="/graphState/localData" component={LocalDataApp}/>
            <Route path="/graphState/graphqlServer" component={GraphQLDataApp}/>
        </Switch>
    );
});