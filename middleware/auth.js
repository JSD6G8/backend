import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const authToken = req.cookies.loglife;

  if (!authToken) {
    return res.status(401).json({
      message: "Unauthorized access",
      status: "Unauthorized",
    });
  }

  try {
    const user = jwt.verify(authToken, process.env.TOKEN_KEY);
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
