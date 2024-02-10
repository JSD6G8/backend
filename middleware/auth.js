import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
    const authHeaders = req.cookies.loglife
    let authToken = ''

    try {
        if (authHeaders) {
            authToken = authHeaders;
        }
        console.log('token',authToken);
        const user = jwt.verify(authToken, process.env.TOKEN_KEY)
        console.log('user',user);
    } catch (error) {
        return res.status(401).send("Invalid token");
    }

    return next();
}

export default verifyToken;