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
exports.AbstractDataRequest = void 0;
const util_1 = require("./util");
class AbstractDataRequest {
    constructor(_dataService, _args) {
        this._dataService = _dataService;
        this._args = _args;
        this._joinedResolvers = [];
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            let data;
            try {
                data = yield this._dataService.onExecute(this._args);
                if (typeof data !== 'object' || data === null) {
                    throw new Error("The remote loader must return an object");
                }
            }
            catch (ex) {
                this.reject(ex);
                return;
            }
            finally {
                this._dataService.onComplete(this._args);
            }
            this.resolve(data);
        });
    }
    newPromise(args) {
        return new Promise((resolve, reject) => {
            this._joinedResolvers.push({ args, resolve, reject });
        });
    }
    get args() {
        return this._args;
    }
    resolve(data) {
        const filter = new util_1.ObjectFilter(this._dataService.entityManager.schema, data, this._args.ids, this._args.shape);
        for (const resolver of this._joinedResolvers) {
            try {
                const filtered = filter.get(resolver.args.ids);
                let reshaped = this.reshape(filtered, resolver.args);
                resolver.resolve(reshaped);
            }
            catch (ex) {
                console.warn(ex);
            }
        }
    }
    reject(error) {
        for (const resolver of this._joinedResolvers) {
            try {
                resolver.reject(error);
            }
            catch (ex) {
                console.warn(ex);
            }
        }
    }
    reshape(data, args) {
        if (this._args.shape.toString() === args.shape.toString()) {
            return data;
        }
        return (0, util_1.reshapeObject)(this._dataService.entityManager.schema, data, args.shape);
    }
}
exports.AbstractDataRequest = AbstractDataRequest;
