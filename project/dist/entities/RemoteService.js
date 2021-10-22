"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteService = void 0;
class RemoteService {
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.pendingRequestMap = new Map();
    }
    query(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const [promise, primary] = this.sharedPromise(args);
            const data = yield promise;
            return this.reshape(data, args, !primary);
        });
    }
    sharedPromise(args) {
        let pendingRequest = undefined;
        for (const [, request] of this.pendingRequestMap) {
            if (request.args.contains(args)) {
                pendingRequest = request;
                break;
            }
        }
        if (pendingRequest === undefined) {
            pendingRequest = new PendingRequest(this, args);
            this.pendingRequestMap.set(args.key, pendingRequest);
            pendingRequest.start();
            return [pendingRequest.join(args), true];
        }
        return [pendingRequest.join(args), false];
    }
    " $unregister"(args) {
        this.pendingRequestMap.delete(args.key);
    }
    toObjectMap(data, args) {
        var _a, _b;
        const ids = args.ids;
        if (ids === undefined) {
            throw new Error(`'toObjectMap' is not supported for the query args that is not used to load objects`);
        }
        const shape = args.shape;
        const objs = Array.isArray(data) ? data : data["entities"];
        if (!Array.isArray(objs)) {
            throw new Error("For objects loading, the remote loader must return an array or an object with an array field named 'entities'");
        }
        const idFieldName = this.entityManager.schema.typeMap.get(shape.typeName).idField.name;
        const idFieldAlias = (_b = (_a = shape.fieldMap.get(idFieldName)) === null || _a === void 0 ? void 0 : _a.alias) !== null && _b !== void 0 ? _b : idFieldName;
        const objMap = new Map();
        for (const obj of objs) {
            objMap.set(obj[idFieldAlias], obj);
        }
        return objMap;
    }
    reshape(data, args, reshapeObject) {
        if (data === undefined) {
            return undefined;
        }
        if (args.ids !== undefined) {
            const objMap = this.toObjectMap(data, args);
            return args.ids.map(id => {
                const obj = objMap.get(id);
                return reshapeObject ? this.reshapeObject(obj, args.shape) : obj;
            });
        }
        if (reshapeObject) {
            return this.reshapeObject(data, args.shape);
        }
    }
    reshapeObject(obj, shape) {
        var _a, _b;
        if (obj === undefined) {
            return undefined;
        }
        if (Array.isArray(obj)) {
            return obj.map(element => this.reshapeObject(element, shape));
        }
        const type = this.entityManager.schema.typeMap.get(shape.typeName);
        const result = {};
        for (const [, field] of shape.fieldMap) {
            const name = (_a = field.alias) !== null && _a !== void 0 ? _a : field.name;
            const value = obj[name];
            if (((_b = type.fieldMap.get(name)) === null || _b === void 0 ? void 0 : _b.category) === 'CONNECTION') {
                result[name] = this.reshapeConnnection(value, field.childShape);
            }
            else if (field.childShape !== undefined) {
                result[name] = this.reshapeObject(value, field.childShape);
            }
            else {
                result[name] = value;
            }
        }
        return result;
    }
    reshapeConnnection(connection, nodeShape) {
        const edges = connection
            .edges
            .map(edge => {
            return Object.assign(Object.assign({}, edge), { node: this.reshapeObject(edge.node, nodeShape) });
        });
        return Object.assign(Object.assign({}, connection), { edges });
    }
}
exports.RemoteService = RemoteService;
class PendingRequest {
    constructor(remoteSercice, args) {
        this.remoteSercice = remoteSercice;
        this.args = args;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            let data;
            try {
                data = yield this.remoteSercice.entityManager.loadRemoteData(this.args);
                this.save(data);
            }
            catch (ex) {
                this.reject(ex);
                return;
            }
            finally {
                this.remoteSercice.request(this.args);
            }
            this.resolve(data);
        });
    }
    join(args) {
        return new Promise((resolve, reject) => {
            this.joinedResolvers.push({ resolve, reject });
        });
    }
    save(data) {
        if (typeof data !== 'object' || data === null) {
            throw new Error("The remote loader must return an object");
        }
        const entityManager = this.remoteSercice.entityManager;
        const shape = this.args.shape;
        const ids = this.args.ids;
        if (ids === undefined) {
            entityManager.save(shape, data);
        }
        else {
            const objMap = this.remoteSercice.toObjectMap(data, this.args);
            entityManager.modify(() => {
                for (const id of ids) {
                    entityManager.save(shape, objMap.get(id));
                }
            });
        }
    }
    resolve(data) {
        for (const resolver of this.joinedResolvers) {
            try {
                resolver.reject(data);
            }
            catch (ex) {
                console.warn(ex);
            }
        }
    }
    reject(error) {
        for (const resolver of this.joinedResolvers) {
            try {
                resolver.reject(error);
            }
            catch (ex) {
                console.warn(ex);
            }
        }
    }
}
