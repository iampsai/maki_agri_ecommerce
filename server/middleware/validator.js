const { body, validationResult } = require('express-validator');

const productValidationRules = () => {
    return [
        body('name').trim().isLength({ min: 2 }).escape(),
        body('description').trim().isLength({ min: 10 }).escape(),
        body('price').isNumeric(),
        body('images').isArray(),
        body('category').trim().notEmpty()
    ];
};

const userValidationRules = () => {
    return [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('name').trim().isLength({ min: 2 }).escape()
    ];
};

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return res.status(400).json({ errors: errors.array() });
};

module.exports = {
    productValidationRules,
    userValidationRules,
    validate
};
