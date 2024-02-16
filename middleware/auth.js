import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {

  // const authToken = req.cookies.loglife;
  const authHeader = req.headers['authorization']
  if (!authHeader) {
    return res.status(401).json({
      message: "Unauthorized access",
      status: "Unauthorized",
    });
  }

  try {
    const authToken = authHeader.split(" ")[1]
    const user = jwt.verify(authToken, process.env.TOKEN_KEY);
    console.log(authToken);
    req.user = user;
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: "Unauthorized access",
      status: "Unauthorized",
    });
  }

  next();
};

export default verifyToken;
