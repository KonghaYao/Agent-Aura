// 这个文件会移入到dist目录下
import Server from "../../entrypoint.js";
export default (req, context) => {
    return Server.fetch(req, { context });
};
