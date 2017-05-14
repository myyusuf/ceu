const Pages = require('./handlers/pages');
const Assets = require('./handlers/assets');
const Department = require('./handlers/department');
const Student = require('./handlers/student');
const TakenDepartment = require('./handlers/takendepartment');
const TakenDepartmentProblem = require('./handlers/takendepartmentproblem');

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: Pages.home,
  },
  {
    method: 'GET',
    path: '/{param*}',
    handler: Assets.servePublicDirectory,
  },
  {
    method: 'GET',
    path: '/test_component',
    handler: Pages.testComponent,
  },
  {
    method: 'GET',
    path: '/departments',
    handler: Department.find,
  },
  {
    method: 'POST',
    path: '/departments',
    handler: Department.create,
  },
  {
    method: 'PUT',
    path: '/departments/{kode}',
    handler: Department.update,
  },
  {
    method: 'GET',
    path: '/students',
    handler: Student.find,
  },
  {
    method: 'GET',
    path: '/students/{studentId}',
    handler: Student.findOne,
  },
  {
    method: 'GET',
    path: '/takendepartmentproblems',
    handler: TakenDepartmentProblem.find,
  },
  {
    method: 'GET',
    path: '/takendepartments/{siswaId}',
    handler: TakenDepartment.find,
  },
];
