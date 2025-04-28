"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLanguageMiddleware = void 0;
const i18next_1 = __importDefault(require("i18next"));
const i18next_fs_backend_1 = __importDefault(require("i18next-fs-backend"));
const i18next_http_middleware_1 = __importDefault(require("i18next-http-middleware"));
i18next_1.default
    .use(i18next_fs_backend_1.default)
    .use(i18next_http_middleware_1.default.LanguageDetector)
    .init({
    fallbackLng: "hi",
    preload: ["hi", "en"],
    backend: {
        loadPath: "./src/config/locales/{{lng}}/translation.json",
    },
    detection: {
        order: ["querystring", "cookie", "header"], // Detect language in querystring, cookies, or Accept-Language header
        caches: ["cookie"], // Cache user language in cookies
        cookieSecure: false, // Use secure cookies in production
        lookupCookie: "i18next", // Name of the cookie to store language preference
    },
});
const setLanguageMiddleware = (req, res, next) => {
    // console.log(req.headers["accept-language"])
    const lang = req.headers["accept-language"] || "en";
    req.i18n.changeLanguage(lang);
    next();
};
exports.setLanguageMiddleware = setLanguageMiddleware;
exports.default = i18next_1.default;
