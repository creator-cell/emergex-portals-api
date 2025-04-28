"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountProviderType = exports.GlobalAdminRoles = void 0;
var GlobalAdminRoles;
(function (GlobalAdminRoles) {
    GlobalAdminRoles["SuperAdmin"] = "super-admin";
    GlobalAdminRoles["ClientAdmin"] = "client-admin";
})(GlobalAdminRoles || (exports.GlobalAdminRoles = GlobalAdminRoles = {}));
var AccountProviderType;
(function (AccountProviderType) {
    AccountProviderType["Local"] = "Local";
    AccountProviderType["Google"] = "Google";
    AccountProviderType["Facebook"] = "Facebook";
})(AccountProviderType || (exports.AccountProviderType = AccountProviderType = {}));
