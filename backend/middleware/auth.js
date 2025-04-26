import jwt from "jsonwebtoken";

export const JWT_SECRET = "your-secret-key";

export function auth(req, res, next) {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate." });
  }
}
