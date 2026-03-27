const DEFAULT_USER_ID = 1;

const authMiddleware = (req, res, next) => {
  req.userId = DEFAULT_USER_ID;
  return next();
};

module.exports = authMiddleware;
