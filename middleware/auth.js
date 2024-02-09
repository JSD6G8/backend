import jwt from "jsonwebtoken";
//TODO email => uid

const verifyToken = (req, res, next) => {
    const  authHeaders = req.headers['x-access-token']
    let authToken = ''

    if(!authHeaders) {
        return res.status(403).send("token is required");
    }

    try {
        if (authHeaders) {
            authToken = authHeaders;
        }
        console.log('token',authToken);
        const user = jwt.verify(authToken, process.env.TOKEN_KEY)
        console.log('user',user.email);
    } catch (error) {
        return res.status(401).send("Invalid token");
    }

    return next();
}

export default verifyToken;