const DEFAULT_USER_ID = 2;

const authMiddleware = (req, res, next) => {
  req.userId = DEFAULT_USER_ID;
  return next();
};

module.exports = authMiddleware;
