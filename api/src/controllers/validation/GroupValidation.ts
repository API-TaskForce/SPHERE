import { check } from 'express-validator';

const create = [
  check('name')
    .exists()
    .withMessage('A name must be provided')
    .isString()
    .withMessage('The name field must be a string')
    .isLength({ min: 3, max: 50 })
    .withMessage('The name must be between 3 and 50 characters')
    .trim(),
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
  check('_parentGroupId')
    .optional()
    .isString()
    .withMessage('The _parentGroupId field must be a string'),
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
  // Allows promoting a subgroup to root-level by setting _parentGroupId to null.
  // Only org admin/owner should call this in practice (enforced at the UI layer).
  check('_parentGroupId')
    .optional({ nullable: true })
    .custom((val) => val === null || typeof val === 'string')
    .withMessage('_parentGroupId must be null or a valid group ID string'),
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
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('The role must be one of: admin, editor, viewer'),
];

const updateMemberRole = [
  check('role')
    .exists()
    .withMessage('A role must be provided')
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('The role must be one of: admin, editor, viewer'),
];

const addCollection = [
  check('pricingCollectionId')
    .exists()
    .withMessage('A pricingCollectionId must be provided')
    .isString()
    .withMessage('The pricingCollectionId field must be a string'),
  check('accessRole')
    .optional({ nullable: true })
    .isIn(['editor', 'viewer'])
    .withMessage('The accessRole must be one of: editor, viewer'),
];

const updateCollectionAccess = [
  check('accessRole')
    .optional({ nullable: true })
    .isIn(['editor', 'viewer'])
    .withMessage('The accessRole must be one of: editor, viewer'),
];

export { create, update, addMember, updateMemberRole, addCollection, updateCollectionAccess };
