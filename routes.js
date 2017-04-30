const Pages = require('./handlers/pages');
const Assets = require('./handlers/assets');
const Student = require('./handlers/student');
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
];
