import { FC, memo } from "react";
import { Route, Switch } from "wouter";
import { App as WritableStateApp } from  '../simple/writale/App';
import { App as ComputedStateApp } from '../simple/computed/App';
import { App as AsyncStateApp } from '../simple/async/App';
import { App as EffectApp } from '../simple/effect/App';
import { App as ScopeApp } from '../simple/scope/App';
import { App as LocalDataApp } from '../graph/local/App';
import { App as GraphQLServerApp } from  '../graph/graphql/App';
import { App as PeakClippingApp } from '../graph/http/peak/App';
import { App as ObjectApp } from '../graph/http/object/App';
import { App as ShapeApp } from '../graph/http/shape/App';
import { App as PendingApp } from '../graph/http/pending/App';

export const ContentView: FC = memo(() =>{
    return (
        <Switch>
            <Route path="/simpleState/writableState" component={WritableStateApp}/>
            <Route path="/simpleState/computedState" component={ComputedStateApp}/>
            <Route path="/simpleState/asyncState" component={AsyncStateApp}/>
            <Route path="/simpleState/effect" component={EffectApp}/>
            <Route path="/simpleState/scope" component={ScopeApp}/>
            <Route path="/graphState/localData" component={LocalDataApp}/>
            <Route 
                path="/graphState/graphqlServer/unoptimized" 
                component={() =>
                    <GraphQLServerApp withCustomerOptimization={false}/>
                }
            />
            <Route 
                path="/graphState/graphqlServer/optimized" 
                component={() =>
                    <GraphQLServerApp withCustomerOptimization={true}/>
                }
            />
            <Route path="/graphState/httpOpitimizator/peakClipping" component={PeakClippingApp}/>
            <Route path="/graphState/httpOpitimizator/objectBaseOnId" component={ObjectApp}/>
            <Route path="/graphState/httpOpitimizator/mergeDifferentShapes" component={ShapeApp}/>
            <Route path="/graphState/httpOpitimizator/reusePendingQueries" component={PendingApp}/>
        </Switch>
    );
});
