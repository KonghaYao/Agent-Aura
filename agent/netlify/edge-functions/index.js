import Server from "../../dist/entrypoint.js";
export default (req, context) => {
    return Server.fetch(req, { context });
};
