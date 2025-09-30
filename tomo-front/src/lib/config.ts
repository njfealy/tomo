export const API_HOST = (() => {
    if (process.env.NODE_ENV == "development") {
        return "http://localhost:5001/api"
    }
    return "https://nickfealytomo.site/api"//"http://backend:5000/api" 
})();