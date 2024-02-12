import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
    const authHeaders = req.cookies.loglife
    let authToken = ''

    try {
        if (authHeaders) {
            authToken = authHeaders;
        }
        const user = jwt.verify(authToken, process.env.TOKEN_KEY)
    } catch (error) {
        return res.status(301).send("Unauthorized access");
    }

    return next();
}

export default verifyToken;