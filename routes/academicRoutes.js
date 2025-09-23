// routes/academicRoutes.js
import express from 'express';
import * as ctrl from '../controllers/academicController.js';
const router = express.Router();

// institutions
router.get('/institutions', ctrl.listInstitutions);
router.post('/institutions', ctrl.createInstitution);
router.put('/institutions/:id', ctrl.updateInstitution);
router.delete('/institutions/:id', ctrl.deleteInstitution);

// departments
router.get('/departments', ctrl.listDepartments);
router.post('/departments', ctrl.createDepartment);
router.put('/departments/:id', ctrl.updateDepartment);
router.delete('/departments/:id', ctrl.deleteDepartment);

// programs
router.get('/programs', ctrl.listPrograms);
router.post('/programs', ctrl.createProgram);
router.put('/programs/:id', ctrl.updateProgram);
router.delete('/programs/:id', ctrl.deleteProgram);

// classes
router.get('/classes', ctrl.listClasses);
router.post('/classes', ctrl.createClass);
router.put('/classes/:id', ctrl.updateClass);
router.delete('/classes/:id', ctrl.deleteClass);

// sections
router.get('/sections', ctrl.listSections);
router.post('/sections', ctrl.createSection);
router.put('/sections/:id', ctrl.updateSection);
router.delete('/sections/:id', ctrl.deleteSection);

// convenience: full structure for institution
router.get('/structure/:institutionId', ctrl.fullStructure);

export default router;
