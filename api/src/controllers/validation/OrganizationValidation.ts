import { check } from 'express-validator';

const create = [
  check('name')
    .if((value: any, { req }: any) => !req.body.isPersonal)
    .exists()
    .withMessage('A name must be provided')
    .isString()
    .withMessage('The name field must be a string')
    .isLength({ min: 3, max: 50 })
    .withMessage('The name must be between 3 and 50 characters')
    .matches(/^[a-z0-9_-]+$/)
    .withMessage('The name may only contain lowercase letters, numbers, hyphens and underscores')
    .trim(),
  check('displayName')
    .exists()
    .withMessage('A displayName must be provided')
    .isString()
    .withMessage('The displayName field must be a string')
    .isLength({ max: 255 })
    .withMessage('The displayName must not exceed 255 characters')
    .trim(),
  check('description')
    .optional()
    .isString()
    .withMessage('The description field must be a string')
    .trim(),
  check('avatarUrl')
    .optional()
    .isURL()
    .withMessage('The avatarUrl must be a valid URL'),
  check('isPersonal')
    .optional()
    .isBoolean()
    .withMessage('The isPersonal field must be a boolean'),
];

const update = [
  check('displayName')
    .optional()
    .isString()
    .withMessage('The displayName field must be a string')
    .isLength({ max: 255 })
    .withMessage('The displayName must not exceed 255 characters')
    .trim(),
  check('description')
    .optional()
    .isString()
    .withMessage('The description field must be a string')
    .trim(),
  check('avatarUrl')
    .optional()
    .isURL()
    .withMessage('The avatarUrl must be a valid URL'),
];

const addMember = [
  check('userId')
    .exists()
    .withMessage('A userId must be provided')
    .isString()
    .withMessage('The userId field must be a string'),
  check('role')
    .exists()
    .withMessage('A role must be provided')
    .isIn(['owner', 'admin', 'member'])
    .withMessage('The role must be one of: owner, admin, member'),
];

const updateMemberRole = [
  check('role')
    .exists()
    .withMessage('A role must be provided')
    .isIn(['owner', 'admin', 'member'])
    .withMessage('The role must be one of: owner, admin, member'),
];

export { create, update, addMember, updateMemberRole };
