import express from 'express';
import {
  getBusinessCategories,
  getArticleCategories,
  getBusinessTypes,
  getAddressType,
  getLocations,
  getCompanyTypes,
  getCountries,
  getStates,
} from '../controllers/masterController.js';

const router = express.Router();

/**
 * @swagger
 * /master/business-categories:
 *   get:
 *     summary: Get all business categories
 *     tags: [Master]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/business-categories', getBusinessCategories);

/**
 * @swagger
 * /master/article-categories:
 *   get:
 *     summary: Get all article categories
 *     tags: [Master]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/article-categories', getArticleCategories);

/**
 * @swagger
 * /master/business-types:
 *   get:
 *     summary: Get all business types
 *     tags: [Master]
 *     responses:
 *       200:
 *         description: List of business types
 */
router.get('/business-types', getBusinessTypes);

/**
 * @swagger
 * /master/address-types:
 *   get:
 *     summary: Get all address types
 *     tags: [Master]
 *     responses:
 *       200:
 *         description: List of address types
 */
router.get('/address-types', getAddressType);

/**
 * @swagger
 * /master/locations:
 *   get:
 *     summary: Get all locations
 *     tags: [Master]
 *     responses:
 *       200:
 *         description: List of locations
 */
router.get('/locations', getLocations);

/**
 * @swagger
 * /master/company-types:
 *   get:
 *     summary: Get all company types
 *     tags: [Master]
 *     responses:
 *       200:
 *         description: List of company types
 */
router.get('/company-types', getCompanyTypes);

/**
 * @swagger
 * /master/countries:
 *   get:
 *     summary: Get all countries
 *     tags: [Master]
 *     responses:
 *       200:
 *         description: List of countries
 */
router.get('/countries', getCountries);

/**
 * @swagger
 * /master/states/{countryid}:
 *   get:
 *     summary: Get all states for a country
 *     tags: [Master]
 *     parameters:
 *       - in: path
 *         name: countryid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of states
 */
router.get('/states/:countryid', getStates);

export default router;