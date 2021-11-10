"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityManager = void 0;
const MergedDataService_1 = require("../data/MergedDataService");
const RemoteDataService_1 = require("../data/RemoteDataService");
const ModificationContext_1 = require("./ModificationContext");
const PaginationQueryResult_1 = require("./PaginationQueryResult");
const QueryResult_1 = require("./QueryResult");
const Record_1 = require("./Record");
const RecordManager_1 = require("./RecordManager");
class EntityManager {
    constructor(stateManager, schema) {
        this.stateManager = stateManager;
        this.schema = schema;
        this._recordManagerMap = new Map();
        this._queryResultMap = new Map();
        this._evictListenerMap = new Map();
        this._changeListenerMap = new Map();
        this._bidirectionalAssociationManagementSuspending = false;
        this._modificationVersion = 0;
        this.dataService = new MergedDataService_1.MergedDataService(new RemoteDataService_1.RemoteDataService(this));
        const queryType = schema.typeMap.get("Query");
        if (queryType !== undefined) {
            this.saveId("Query", Record_1.QUERY_OBJECT_ID);
        }
    }
    recordManager(typeName) {
        const type = this.schema.typeMap.get(typeName);
        if (type === undefined) {
            throw new Error(`Illegal type "${typeName}" that is not exists in schema`);
        }
        let recordManager = this._recordManagerMap.get(typeName);
        if (recordManager === undefined) {
            recordManager = new RecordManager_1.RecordManager(this, type);
            this._recordManagerMap.set(typeName, recordManager);
            recordManager.initializeOtherManagers();
        }
        return recordManager;
    }
    findRefById(typeName, id) {
        return this.recordManager(typeName).findRefById(id);
    }
    get modificationContext() {
        const ctx = this._ctx;
        if (ctx === undefined) {
            throw new Error(`No modificaton context`);
        }
        return ctx;
    }
    get modificationVersion() {
        return this._modificationVersion;
    }
    modify(action, forGC = false) {
        if (this._ctx !== undefined) {
            if (forGC) {
                throw new Error("Internal bug: cannot mdoify for GC under exsitsing modification context");
            }
            return action();
        }
        else {
            this._ctx = new ModificationContext_1.ModificationContext(() => { ++this._modificationVersion; }, this.publishEvictChangeEvent.bind(this), this.publishEntityChangeEvent.bind(this), forGC);
            try {
                return action();
            }
            finally {
                try {
                    this._ctx.close();
                }
                finally {
                    this._ctx = undefined;
                }
            }
        }
    }
    save(shape, objOrArray, pagination) {
        if (pagination !== undefined && shape.typeName !== 'Query') {
            throw new Error(`The save method cannot accept pagination when the type name of shape is not "Query"`);
        }
        if (shape.typeName === "Mutation") {
            throw new Error(`save() does not accept object whose type is 'Mutation'`);
        }
        this.modify(() => {
            this.visit(shape, objOrArray, (id, runtimeType, field, args, value) => {
                const manager = this.recordManager(field.declaringType.name);
                manager.set(id, runtimeType, field, args, value, runtimeType.name === 'Query' ? pagination : undefined);
            });
        });
    }
    delete(typeName, idOrArray) {
        if (typeName === 'Query') {
            throw new Error(`The typeof deleted object cannot be the special type 'Query'`);
        }
        this.modify(() => {
            const recordManager = this.recordManager(typeName);
            if (Array.isArray(idOrArray)) {
                for (const id of idOrArray) {
                    if (id !== undefined && id !== null) {
                        recordManager.delete(id);
                    }
                }
            }
            else if (idOrArray !== undefined && idOrArray !== null) {
                recordManager.delete(idOrArray);
            }
        });
    }
    evict(typeName, idOrArray) {
        this.modify(() => {
            if (typeName === "Query") {
                this.recordManager("Query").evict(Record_1.QUERY_OBJECT_ID);
            }
            else {
                const recordManager = this.recordManager(typeName);
                if (Array.isArray(idOrArray)) {
                    for (const id of idOrArray) {
                        if (id !== undefined && id !== null) {
                            recordManager.delete(id);
                        }
                    }
                }
                else if (idOrArray !== undefined && idOrArray !== null) {
                    recordManager.evict(idOrArray);
                }
            }
        });
    }
    saveId(typeName, id) {
        return this.modify(() => {
            const type = this.schema.typeMap.get(typeName);
            if (type === undefined) {
                throw new Error(`Cannot save object id for illegal type "${typeName}"`);
            }
            if (typeName === "Mutation") {
                throw new Error(`saveId() does not accept object whose type is 'Mutation'`);
            }
            return this.recordManager(typeName).saveId(id, type);
        });
    }
    retain(args) {
        let result = this._queryResultMap.get(args.key);
        if (result === undefined) {
            if (!this.schema.isAcceptable(args.fetcher.fetchableType)) {
                throw new Error("Cannot accept that fetcher because it is not configured in the state manager");
            }
            if (args.pagination !== undefined) {
                result = new PaginationQueryResult_1.PaginationQueryResult(this, args, () => {
                    this._queryResultMap.delete(args.key);
                    this.gc();
                });
            }
            else {
                result = new QueryResult_1.QueryResult(this, args, () => {
                    this._queryResultMap.delete(args.key);
                    this.gc();
                });
            }
            this._queryResultMap.set(args.key, result);
        }
        return result.retain();
    }
    release(args, releasePolicy) {
        const result = this._queryResultMap.get(args.key);
        result === null || result === void 0 ? void 0 : result.release(releasePolicy);
    }
    addEvictListener(typeName, listener) {
        if (listener !== undefined && listener !== null) {
            let set = this._evictListenerMap.get(typeName);
            if (set === undefined) {
                set = new Set();
                this._evictListenerMap.set(typeName, set);
            }
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }
    removeEvictListener(typeName, listener) {
        var _a;
        (_a = this._evictListenerMap.get(typeName)) === null || _a === void 0 ? void 0 : _a.delete(listener);
    }
    publishEvictChangeEvent(e) {
        this.refreshByEvictEvent(e);
        for (const [, set] of this._evictListenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }
    addChangeListener(typeName, listener) {
        if (listener !== undefined && listener !== null) {
            let set = this._changeListenerMap.get(typeName);
            if (set === undefined) {
                set = new Set();
                this._changeListenerMap.set(typeName, set);
            }
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }
    removeChangeListener(typeName, listener) {
        var _a;
        (_a = this._changeListenerMap.get(typeName)) === null || _a === void 0 ? void 0 : _a.delete(listener);
    }
    publishEntityChangeEvent(e) {
        this.refreshByChangeEvent(e);
        for (const [, set] of this._changeListenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }
    refreshByEvictEvent(e) {
        var _a, _b;
        (_b = (_a = this.recordManager(e.typeName).findRefById(e.id)) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.refreshByEvictEvent(this, e);
    }
    refreshByChangeEvent(e) {
        for (let type = this.schema.typeMap.get(e.typeName); type !== undefined; type = type.superType) {
            for (const field of type.backRefFields) {
                this.recordManager(field.declaringType.name).refresh(field, e);
            }
        }
    }
    forEach(typeName, visitor) {
        this.recordManager(typeName).forEach(visitor);
    }
    get isBidirectionalAssociationManagementSuspending() {
        return this._bidirectionalAssociationManagementSuspending;
    }
    suspendBidirectionalAssociationManagement(action) {
        if (this._bidirectionalAssociationManagementSuspending) {
            return action();
        }
        this._bidirectionalAssociationManagementSuspending = true;
        try {
            return action();
        }
        finally {
            this._bidirectionalAssociationManagementSuspending = false;
        }
    }
    gc() {
        if (this._gcTimerId === undefined) {
            this._gcTimerId = setTimeout(() => {
                this._gcTimerId = undefined;
                this.onGC();
            }, 0);
        }
    }
    onGC() {
        for (const result of this._queryResultMap.values()) {
            result.gcVisit();
        }
        const garbages = [];
        for (const rm of this._recordManagerMap.values()) {
            rm.collectGarbages(garbages);
        }
        if (garbages.length !== 0) {
            this.modify(() => {
                for (const garbage of garbages) {
                    if (garbage instanceof Record_1.Record) {
                        this.evict(garbage.runtimeType.name, garbage.id);
                    }
                    else {
                        garbage.record.evict(this, garbage.field, garbage.args);
                    }
                }
            }, true);
        }
    }
    visit(shape, objOrArray, visitor) {
        const type = this.schema.typeMap.get(shape.typeName);
        if (type === undefined) {
            throw new Error(`Illegal type name "${shape.typeName}" of shape`);
        }
        if (Array.isArray(objOrArray)) {
            for (const obj of objOrArray) {
                this.visitObj(shape, obj, type, visitor);
            }
        }
        else if (objOrArray !== undefined && objOrArray !== null) {
            this.visitObj(shape, objOrArray, type, visitor);
        }
    }
    visitObj(shape, obj, type, visitor) {
        var _a, _b, _c;
        const runtimeTypeName = (_a = obj["__typename"]) !== null && _a !== void 0 ? _a : type.name;
        const runtimeType = runtimeTypeName === type.name ? type : this.schema.typeMap.get(runtimeTypeName);
        if (runtimeType === undefined) {
            throw new Error(`Illegal typed name "${runtimeTypeName}" of obj["__typename"]`);
        }
        if (!type.isAssignableFrom(runtimeType)) {
            throw new Error(`Cannot visit obj with illegal type "${runtimeType.name}" because that type is not derived type of "${type.name}"`);
        }
        if (typeof obj !== "object" || Array.isArray(obj)) {
            throw new Error("Cannot visit data that is not plain object");
        }
        let idFieldName;
        let id;
        if (shape.typeName === 'Query') {
            idFieldName = undefined;
            id = Record_1.QUERY_OBJECT_ID;
        }
        else {
            idFieldName = type.idField.name;
            const idShapeField = shape.fieldMap.get(idFieldName);
            if (idShapeField === undefined) {
                throw new Error(`Cannot visit the object whose type is "${shape.typeName}" without id`);
            }
            id = obj[(_b = idShapeField.alias) !== null && _b !== void 0 ? _b : idShapeField.name];
            if (id === undefined || id === null) {
                throw new Error(`Cannot visit the object whose type is "${shape.typeName}" without id`);
            }
        }
        for (const [, shapeField] of shape.fieldMap) {
            if (shapeField.name !== idFieldName) {
                const field = runtimeType.fieldMap.get(shapeField.name);
                if (field === undefined) {
                    throw new Error(`Cannot visit the non-existing field "${shapeField.name}" for type "${type.name}"`);
                }
                let value = obj[(_c = shapeField.alias) !== null && _c !== void 0 ? _c : shapeField.name];
                if (value === null) {
                    value = undefined;
                }
                if (visitor(id, runtimeType, field, shapeField.args, value) === false) {
                    return;
                }
                if (value !== undefined && field.isAssociation && shapeField.childShape !== undefined) {
                    switch (field.category) {
                        case "REFERENCE":
                            this.visit(shapeField.childShape, value, visitor);
                            break;
                        case "LIST":
                            if (Array.isArray(value)) {
                                for (const element of value) {
                                    this.visit(shapeField.childShape, element, visitor);
                                }
                            }
                            break;
                        case "CONNECTION":
                            const edges = value.edges;
                            if (Array.isArray(edges)) {
                                for (const edge of edges) {
                                    this.visit(shapeField.nodeShape, edge.node, visitor);
                                }
                            }
                            break;
                    }
                }
            }
        }
    }
}
exports.EntityManager = EntityManager;
