const jwt = require("jsonwebtoken");

const LoginRequired = (req, res, next) => {
    try {
        const header = req.headers.authorization; //lấy mã bearer 

        if (!header) { //kiểm tra xem có phải là header (ổ nhớ chứa bearer) hay không, nếu không có thì trả về lỗi 401
            return res.status(401).json({
                status: "error",
                message: "Missing authorization header"
            });
        }

        if (!header.startsWith("Bearer ")) { //kiểm tra xem nó có bắt đầu bằng "Bearer " hay không, nếu không thì trả về lỗi 401    
            return res.status(401).json({
                status: "error",
                message: "Invalid token format"
            });
        }

        const token = header.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (err) {
        return res.status(401).json({
            status: "error",
            message: "Invalid or expired token"
        });
    }
};

module.exports = LoginRequired;