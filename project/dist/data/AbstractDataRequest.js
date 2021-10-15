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
class AbstractDataRequest {
    constructor(dataService, _args) {
        this.dataService = dataService;
        this._args = _args;
        this.joinedResolvers = [];
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            let data;
            try {
                data = yield this.dataService.onLoad(this.args);
                if (typeof data !== 'object' || data === null) {
                    throw new Error("The remote loader must return an object");
                }
                this.dataService.onLoaded(this.args, data);
            }
            catch (ex) {
                this.reject(ex);
                return;
            }
            finally {
                this.dataService[" $unregister"](this.args);
            }
            this.resolve(data);
        });
    }
    newPromise() {
        return new Promise((resolve, reject) => {
            this.joinedResolvers.push({ resolve, reject });
        });
    }
    get args() {
        return this._args;
    }
    resolve(data) {
        for (const resolver of this.joinedResolvers) {
            try {
                resolver.resolve(data);
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
exports.AbstractDataRequest = AbstractDataRequest;
