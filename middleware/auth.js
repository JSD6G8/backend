import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
    const authHeaders = req.cookies.loglife
    let authToken = ''

    try {
        if (authHeaders) {
            authToken = authHeaders;
        }
        // console.log('token',authToken);
        const user = jwt.verify(authToken, process.env.TOKEN_KEY)
        console.log('user',user);
        // console.log('token value',auth);
    } catch (error) {
        return res.status(301).send("Unauthorized access");
        // return res.redirect('/activities/65b8bb93581f2faab26d4120');
    }

    return next();
}

export default verifyToken;