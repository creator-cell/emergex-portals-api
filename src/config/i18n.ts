import i18n from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";

i18n
  .use(Backend)
  .use(middleware.LanguageDetector)
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

  export const setLanguageMiddleware = (req: any, res: any, next: any) => {
    // console.log(req.headers["accept-language"])
    const lang = req.headers["accept-language"] || "en";
    req.i18n.changeLanguage(lang);
    next();
  };

export default i18n;
