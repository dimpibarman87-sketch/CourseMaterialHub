module.exports = (allowedRoles) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: No user found" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access Denied: Required permissions not met.` 
            });
        }
        next();
    };
};